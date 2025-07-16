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
            console.log("Firebase Admin SDK inizializzato con successo.");
        } catch (error) {
            console.error('Firebase Admin Initialization Error:', error);
            // Questo errore bloccherà l'esecuzione se le credenziali su Vercel sono sbagliate.
            throw new Error("Impossibile inizializzare Firebase Admin. Controlla le credenziali su Vercel.");
        }
    }
}

// Eseguiamo l'inizializzazione una sola volta.
initializeFirebaseAdmin();

const db = admin.firestore();

// Funzione principale che Vercel eseguirà quando chiamata.
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();      // Respond OK to preflight
    }
    
    // Controlliamo che la richiesta sia del tipo giusto (POST)
    if (req.method !== 'POST') {
        return res.status(405).send({ error: 'Metodo non consentito' });
    }

    const { title, body, url, imageUrl, userIds } = req.body;

    if (!title || !body || !userIds || userIds.length === 0) {
        return res.status(400).send({ error: 'Dati mancanti: titolo, testo e destinatari sono obbligatori.' });
    }

    try {
        // Prendiamo i "token" (indirizzi per le notifiche) degli utenti selezionati dal database
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

        // Prepariamo il messaggio della notifica
        const message = {
            notification: {
                title: title,
                body: body,
                image: imageUrl || undefined // Aggiunge l'immagine solo se esiste
            },
            webpush: {
                fcm_options: {
                    link: url || 'https://card.alley33.it' // Se non c'è un link, apre l'app
                },
                notification: {
                    icon: 'https://card.alley33.it/icon-192x192.png',
                }
            },
            tokens: tokens,
        };

        // Inviamo il messaggio a tutti i token trovati
        const response = await admin.messaging().sendMulticast(message);
        
        console.log('Notifiche inviate con successo:', response.successCount);
        console.log('Errori nell\'invio:', response.failureCount);

        // Rispondiamo alla dashboard che è andato tutto bene
        res.status(200).send({ success: true, message: `Notifiche inviate a ${response.successCount} utenti.` });

    } catch (error) {
        console.error('Errore grave durante l\'invio delle notifiche:', error);
        // MODIFICA: Invia un messaggio di errore più dettagliato alla dashboard
        res.status(500).send({ error: `Errore interno del server: ${error.message}` });
    }
}
