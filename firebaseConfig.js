const admin = require("firebase-admin");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Check if environment variables are set or use service account file for local development
let serviceAccount;
if (process.env.FIREBASE_PROJECT_ID) {
  // Use environment variables for production
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
} else {
  // Use local service account file for development
  serviceAccount = require("./keys/zions-788b3-firebase-adminsdk-sqciu-130eeba92b.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_BUCKET_NAME || "zions-788b3.appspot.com",
});

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();
const storageRef = admin.storage().bucket();

module.exports = { db, auth, bucket, admin, storageRef };
