const admin = require('firebase-admin');

let firebaseApp = null;

function initializeFirebase() {
  try {
    // Skip Firebase initialization in development if config is not properly set
    if (process.env.NODE_ENV === 'development' && 
        (process.env.FIREBASE_PROJECT_ID === 'your-firebase-project-id' ||
         !process.env.FIREBASE_PROJECT_ID ||
         !process.env.FIREBASE_PRIVATE_KEY ||
         !process.env.FIREBASE_CLIENT_EMAIL)) {
      console.log('🔄 Firebase initialization skipped - using development mode without Firebase auth');
      console.log('📝 To enable Firebase: Update .env with real Firebase service account credentials');
      return null;
    }

    if (!firebaseApp) {
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
      };

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      console.log('✅ Firebase Admin initialized successfully');
    }
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.log('🔄 Continuing without Firebase authentication...');
    console.log('📝 To fix: Check your Firebase service account credentials in .env file');
    return null;
  }
}

function getFirebaseApp() {
  return firebaseApp;
}

async function verifyFirebaseToken(token) {
  try {
    if (!firebaseApp) {
      throw new Error('Firebase not initialized');
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    return null;
  }
}

module.exports = {
  initializeFirebase,
  getFirebaseApp,
  verifyFirebaseToken,
  admin
};