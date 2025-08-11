// Importiamo gli strumenti necessari di Firebase Admin
const admin = require('firebase-admin');

// Funzione per inizializzare Firebase Admin in modo sicuro, solo se non è già attivo.
function initializeFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return;
    }
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

        // Log di debug per verificare il project ID che stiamo usando
        console.log("Tentativo di inizializzazione di Firebase Admin per il progetto:", serviceAccount.project_id);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // Aggiunta esplicita del projectId per eliminare ogni ambiguità
            projectId: serviceAccount.project_id,
        });
        console.log("Firebase Admin SDK inizializzato con successo.");
    } catch (error) {
        console.error('ERRORE CRITICO DI INIZIALIZZAZIONE:', error);
        throw new Error("Impossibile inizializzare Firebase Admin. Controlla le credenziali FIREBASE_SERVICE_ACCOUNT_KEY su Vercel.");
    }
}

// Eseguiamo l'inizializzazione una sola volta all'avvio della funzione.
initializeFirebaseAdmin();

const db = admin.firestore();
const messaging = admin.messaging();

// Funzione principale che Vercel eseguirà quando chiamata.
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito' });
    }

    const { title, body, url, imageUrl, userIds } = req.body;

    if (!title || !body || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: 'Dati mancanti: titolo, testo e destinatari sono obbligatori.' });
    }

    try {
        const usersRef = db.collection('users');
        // Recupera i documenti degli utenti individualmente per evitare il limite di 10 dell'operatore 'in'
        const userDocs = await Promise.all(userIds.map((id) => usersRef.doc(id).get()));

        const tokens = [];
        userDocs.forEach((docSnap) => {
            const userData = docSnap.data();
            if (userData && userData.fcmToken) {
                tokens.push(userData.fcmToken);
            }
        });

        if (tokens.length === 0) {
            return res.status(404).json({ error: 'Nessun utente valido trovato con un token per le notifiche.' });
        }

console.log('Preparazione invio notifica a ' + tokens.length + ' token.');
        const messagePayload = {
            notification: {
                title: title,
                body: body,
                image: imageUrl || undefined
            },
            webpush: {
                fcm_options: {
                    link: url || 'https://card.alley33.it'
                },
                notification: {
                    icon: 'https://card.alley33.it/icon-192x192.png',
                }
            }
        };

        let successCount = 0;
        let failureCount = 0;
        const batchSize = 500;
        for (let i = 0; i < tokens.length; i += batchSize) {
            const batchTokens = tokens.slice(i, i + batchSize);
            const batchResponse = await messaging.sendMulticast({
                ...messagePayload,
                tokens: batchTokens,
            });
            successCount += batchResponse.successCount;
            failureCount += batchResponse.failureCount;
            if (batchResponse.failureCount > 0) {
                batchResponse.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        console.error(`Dettaglio errore per il token ${batchTokens[idx]}:`, resp.error);
                    }
                });
            }
        }

        return res.status(200).json({ success: true, message: `Notifiche inviate a ${successCount} utenti con ${failureCount} errori.` });

    } catch (error) {
        console.error('ERRORE GRAVE DURANTE L\'INVIO:', error);

        let errorMessage = `Errore interno del server: ${error.message}`;
        if (error.code === 'messaging/unknown-error' && error.message.includes('404')) {
            errorMessage = "Errore di configurazione (404). L'API Firebase Cloud Messaging non è configurata correttamente nel tuo progetto Google Cloud. Prova a disabilitarla e riabilitarla.";
        } else if (error.code === 'messaging/third-party-auth-error') {
            errorMessage = "Errore di autenticazione. Controlla che la chiave di servizio su Vercel sia corretta e che l'API FCM sia abilitata.";
        }

        return res.status(500).json({ error: errorMessage });
    }
}
