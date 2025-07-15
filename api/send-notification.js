// Questo è il codice della nostra funzione server (Node.js)
// Vercel la eseguirà in un ambiente sicuro.

// Importiamo gli strumenti necessari di Firebase Admin
const admin = require('firebase-admin');

// Le credenziali verranno prese dalle variabili d'ambiente di Vercel
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

// Inizializziamo l'app di Firebase Admin solo se non è già stata inizializzata
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Questa è la funzione che Vercel eseguirà
export default async function handler(req, res) {
  // Controlliamo che la richiesta sia sicura e corretta
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Method Not Allowed' });
  }

  const { title, body, url, imageUrl, userIds } = req.body;

  if (!title || !body || !userIds || userIds.length === 0) {
    return res.status(400).send({ error: 'Dati mancanti: titolo, testo e destinatari sono obbligatori.' });
  }

  try {
    // Prendiamo i "token" (indirizzi per le notifiche) degli utenti selezionati
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
      },
      webpush: {
        fcm_options: {
          link: url || 'https://card.alley33.it' // Se non c'è un link, apre l'app
        },
        notification: {
          icon: 'https://card.alley33.it/icon-192x192.png', // Icona standard
        }
      },
      tokens: tokens,
    };
    
    // Aggiungiamo l'immagine solo se è stata fornita
    if (imageUrl) {
        message.notification.image = imageUrl;
    }

    // Inviamo il messaggio a tutti i token trovati
    const response = await admin.messaging().sendMulticast(message);
    
    console.log('Notifiche inviate con successo:', response.successCount);
    console.log('Errori nell\'invio:', response.failureCount);

    // Rispondiamo alla dashboard che è andato tutto bene
    res.status(200).send({ success: true, message: `Notifiche inviate a ${response.successCount} utenti.` });

  } catch (error) {
    console.error('Errore grave durante l\'invio delle notifiche:', error);
    res.status(500).send({ error: 'Errore interno del server.' });
  }
}
