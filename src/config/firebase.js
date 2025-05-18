const admin = require('firebase-admin');
const serviceAccount = require('./elearningsa-bca0b-firebase-adminsdk.json'); 

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;