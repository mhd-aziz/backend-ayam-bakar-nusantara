// firebase-config.js

const admin = require("firebase-admin");
const serviceAccount = require('./service-account-file.json'); // Ganti dengan path file json yang sudah diunduh

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "aziz-project-446709.firebasestorage.app", // Ganti dengan project ID Anda
});

const bucket = admin.storage().bucket();

module.exports = { bucket };
