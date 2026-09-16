import fs from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function readServiceAccount() {
  const encodedServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (encodedServiceAccount) {
    try {
      const decoded = Buffer.from(encodedServiceAccount.replace(/\s/g, ""), "base64").toString("utf8");
      const account = JSON.parse(decoded);
      if (!account.project_id || !account.client_email || !account.private_key) {
        throw new Error("decoded service account is missing project_id, client_email, or private_key");
      }
      return account;
    } catch (error) {
      throw new Error(`Unable to decode FIREBASE_SERVICE_ACCOUNT_BASE64: ${error.message}`);
    }
  }
  const jsonServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonServiceAccount) {
    try {
      return JSON.parse(jsonServiceAccount);
    } catch (error) {
      throw new Error(`Unable to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${error.message}`);
    }
  }
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) return null;
  try {
    return JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read Firebase service account file: ${error.message}`);
  }
}

function normalizePrivateKey(value) {
  if (!value) return value;
  let key = String(value).trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) key = key.slice(1, -1);
  return key.replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\r\n/g, "\n").trim();
}

const serviceAccount = readServiceAccount();
const databaseId = process.env.FIRESTORE_DATABASE_ID || "(default)";
export const firebaseConfig = {
  projectId: serviceAccount?.project_id || process.env.FIREBASE_PROJECT_ID,
  clientEmail: serviceAccount?.client_email || process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: normalizePrivateKey(serviceAccount?.private_key || process.env.FIREBASE_PRIVATE_KEY),
};

const hasFirebaseConfig = Boolean(firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey);

if (hasFirebaseConfig && !getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: firebaseConfig.projectId,
        clientEmail: firebaseConfig.clientEmail,
        privateKey: firebaseConfig.privateKey,
      }),
    });
  } catch (error) {
    throw new Error(
      "Firebase credentials are invalid. Use FIREBASE_SERVICE_ACCOUNT_BASE64 with a complete service-account JSON file, not a pasted or quoted private key.",
      { cause: error },
    );
  }
}

export const db = hasFirebaseConfig ? getFirestore(undefined, databaseId) : null;
export const firestoreDatabaseId = databaseId;

export async function verifyFirebaseToken(token) {
  if (!hasFirebaseConfig || !token) return null;
  return getAuth().verifyIdToken(token);
}

export async function listFirebaseUsers() {
  if (!hasFirebaseConfig) return [];
  const result = await getAuth().listUsers(1000);
  return result.users.map((user) => ({
    id: `firebase:${user.uid}`,
    firebaseUid: user.uid,
    name: user.displayName || user.email?.split("@")[0] || "User",
    email: user.email || "",
    phone: user.phoneNumber || "",
    address: "",
    city: "Bhiwadi",
    state: "Rajasthan",
    pincode: "",
    role: user.customClaims?.role === "partner" ? "partner" : "customer",
    orders: 0,
    spent: 0,
    createdAt: user.metadata.creationTime || null,
  }));
}

export async function updateFirebaseUserRole(uid, role) {
  if (!hasFirebaseConfig) throw new Error("Firebase Authentication is not configured");
  const auth = getAuth();
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { ...(user.customClaims || {}), role });
  return { uid, name: user.displayName || user.email?.split("@")[0] || "User", email: user.email || "", phone: user.phoneNumber || "", role };
}
