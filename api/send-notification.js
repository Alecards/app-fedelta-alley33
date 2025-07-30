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
        const q = await usersRef.where(admin.firestore.FieldPath.documentId(), 'in', userIds).get();
        
        const tokens = [];
        q.forEach(doc => {
            const userData = doc.data();
            if (userData.fcmToken) {
                tokens.push(userData.fcmToken);
            }
        });

        if (tokens.length === 0) {
            return res.status(404).json({ error: 'Nessun utente valido trovato con un token per le notifiche.' });
        }

        console.log(`Preparazione invio notifica a ${tokens.length} token.`);

        const message = {
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
            },
            tokens: tokens,
        };

        const response = await messaging.sendMulticast(message);
        
        console.log('Notifiche inviate con successo:', response.successCount);
        console.log('Errori nell\'invio:', response.failureCount);

        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`Dettaglio errore per il token ${idx}:`, resp.error);
                }
            });
        }

        res.status(200).json({ success: true, message: `Notifiche inviate a ${response.successCount} utenti.` });

    } catch (error) {
        console.error('ERRORE GRAVE DURANTE L\'INVIO:', error);
        
        let errorMessage = `Errore interno del server: ${error.message}`;
        if (error.code === 'messaging/unknown-error' && error.message.includes('404')) {
             errorMessage = "Errore di configurazione (404). L'API Firebase Cloud Messaging non è configurata correttamente nel tuo progetto Google Cloud. Prova a disabilitarla e riabilitarla.";
        } else if (error.code === 'messaging/third-party-auth-error') {
            errorMessage = "Errore di autenticazione. Controlla che la chiave di servizio su Vercel sia corretta e che l'API FCM sia abilitata.";
        }
        
        res.status(500).json({ error: errorMessage });
    }
}
