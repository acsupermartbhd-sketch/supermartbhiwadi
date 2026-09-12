import fs from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function readServiceAccount() {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) return null;
  try {
    return JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read Firebase service account file: ${error.message}`);
  }
}

const serviceAccount = readServiceAccount();
const databaseId = process.env.FIRESTORE_DATABASE_ID || "(default)";
export const firebaseConfig = {
  projectId: serviceAccount?.project_id || process.env.FIREBASE_PROJECT_ID,
  clientEmail: serviceAccount?.client_email || process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: serviceAccount?.private_key?.replace(/\\n/g, "\n") || process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const hasFirebaseConfig = Boolean(firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey);

if (hasFirebaseConfig && !getApps().length) {
  initializeApp({
    credential: cert({
      projectId: firebaseConfig.projectId,
      clientEmail: firebaseConfig.clientEmail,
      privateKey: firebaseConfig.privateKey,
    }),
  });
}

export const db = hasFirebaseConfig ? getFirestore(undefined, databaseId) : null;
export const firestoreDatabaseId = databaseId;

export async function verifyFirebaseToken(token) {
  if (!hasFirebaseConfig || !token) return null;
  return getAuth().verifyIdToken(token);
}
