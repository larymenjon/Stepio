import "dotenv/config";
import express from "express";
import cors from "cors";
import admin from "firebase-admin";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4242;
const APP_URL = process.env.APP_URL || "http://localhost:8080";

const revenueCatApiKey = process.env.REVENUECAT_API_KEY;
const revenueCatEntitlementId = process.env.REVENUECAT_ENTITLEMENT_ID || "pro";
const revenueCatWebhookAuth = process.env.REVENUECAT_WEBHOOK_AUTH;

if (!revenueCatApiKey) {
  throw new Error("Missing REVENUECAT_API_KEY");
}

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;
  if (!serviceAccount) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT");
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const app = express();

app.use(
  cors({
    origin: [APP_URL],
    methods: ["GET", "POST"],
    credentials: false,
  }),
);

app.use(express.json());

async function getUserFromAuth(req) {
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.split(" ");
  if (!token) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded;
  } catch {
    return null;
  }
}

async function fetchRevenueCatSubscriber(appUserId) {
  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    {
      headers: {
        Authorization: `Bearer ${revenueCatApiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (response.status === 404) {
    return { subscriber: { entitlements: {} } };
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "RevenueCat request failed");
  }

  return response.json();
}

function buildPlanFromEntitlement(entitlement) {
  if (!entitlement) {
    return { tier: "free", status: "inactive", renewalDate: null };
  }

  const expiresAt = entitlement.expires_date ? new Date(entitlement.expires_date) : null;
  const now = new Date();
  const isActive = !expiresAt || expiresAt > now;

  return {
    tier: isActive ? "pro" : "free",
    status: isActive ? "active" : "inactive",
    renewalDate: entitlement.expires_date ?? null,
    productId: entitlement.product_identifier ?? null,
  };
}

async function syncUserEntitlements(uid) {
  const subscriber = await fetchRevenueCatSubscriber(uid);
  const entitlement =
    subscriber?.subscriber?.entitlements?.[revenueCatEntitlementId] ?? null;
  const plan = buildPlanFromEntitlement(entitlement);

  await db.collection("users").doc(uid).set({ plan }, { merge: true });
  return plan;
}

app.post("/api/billing/sync-entitlements", async (req, res) => {
  const authUser = await getUserFromAuth(req);
  if (!authUser) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const plan = await syncUserEntitlements(authUser.uid);
    return res.json({ plan });
  } catch (err) {
    return res.status(500).send(err?.message ?? "Failed to sync entitlements");
  }
});

app.post("/webhook/revenuecat", async (req, res) => {
  if (revenueCatWebhookAuth) {
    const authHeader = req.headers.authorization || "";
    if (authHeader !== revenueCatWebhookAuth) {
      return res.status(401).send("Unauthorized");
    }
  }

  const appUserId =
    req.body?.event?.app_user_id ||
    req.body?.app_user_id ||
    req.body?.subscriber?.app_user_id ||
    req.body?.event?.subscriber?.app_user_id;

  if (!appUserId) {
    return res.status(400).send("Missing app_user_id");
  }

  try {
    await syncUserEntitlements(appUserId);
    return res.json({ received: true });
  } catch (err) {
    return res.status(500).send(err?.message ?? "Failed to process webhook");
  }
});

app.listen(PORT, () => {
  console.log(`[stepio] billing server running on http://localhost:${PORT}`);
});
