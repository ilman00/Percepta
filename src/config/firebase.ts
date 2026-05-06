import admin from "firebase-admin";
import serviceAccountJson from "./serviceAccountKey.json";

const serviceAccount: admin.ServiceAccount = {
  projectId: serviceAccountJson.project_id,
  clientEmail: serviceAccountJson.client_email,
  privateKey: serviceAccountJson.private_key,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;