// Questo è il codice della nostra funzione server (Node.js)
const admin = require('firebase-admin');

// Funzione per inizializzare Firebase Admin in modo sicuro, solo se non è già attivo.
function initializeFirebaseAdmin() {
    if (admin.apps.length === 0) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } catch (error) {
            console.error('Firebase Admin Initialization Error:', error);
            throw new Error("Impossibile inizializzare Firebase Admin. Controlla le credenziali su Vercel.");
        }
    }
}

// Eseguiamo l'inizializzazione una sola volta.
initializeFirebaseAdmin();

const db = admin.firestore();

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

        const response = await admin.messaging().sendMulticast(message);
        
        res.status(200).json({ success: true, message: `Notifiche inviate a ${response.successCount} utenti.` });

    } catch (error) {
        console.error('Errore grave durante l\'invio delle notifiche:', error);
        
        let errorMessage = `Errore interno del server: ${error.message}`;
        // Aggiunge un messaggio specifico se l'errore è quello che abbiamo visto
        if (error.code === 'messaging/unknown-error' && error.message.includes('404')) {
             errorMessage = "Errore di configurazione (404). L'API Firebase Cloud Messaging potrebbe non essere configurata correttamente nel tuo progetto Google Cloud, anche se risulta abilitata. Prova a disabilitarla e riabilitarla.";
        } else if (error.code === 'messaging/third-party-auth-error') {
            errorMessage = "Errore di autenticazione con il servizio di messaggistica. Controlla che la chiave di servizio su Vercel sia corretta e che l'API FCM sia abilitata.";
        }
        
        res.status(500).json({ error: errorMessage });
    }
}
