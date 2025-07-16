// Questo è il codice della nostra funzione server (Node.js)
const admin = require('firebase-admin');

// Le credenziali verranno prese dalle variabili d'ambiente di Vercel
try {
    if (!admin.apps.length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
} catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
}

const db = admin.firestore();

// Funzione principale che Vercel eseguirà
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();      // Respond OK to preflight
    }
    
    if (req.method !== 'POST') {
        return res.status(405).send({ error: 'Method Not Allowed' });
    }

    const { title, body, url, imageUrl, userIds } = req.body;

    if (!title || !body || !userIds || userIds.length === 0) {
        return res.status(400).send({ error: 'Dati mancanti: titolo, testo e destinatari sono obbligatori.' });
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
            return res.status(404).send({ error: 'Nessun utente valido trovato con un token per le notifiche.' });
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

        res.status(200).send({ success: true, message: `Notifiche inviate a ${response.successCount} utenti.` });

    } catch (error) {
        console.error('Errore durante l\'invio delle notifiche:', error);
        res.status(500).send({ error: 'Errore interno del server.' });
    }
}
