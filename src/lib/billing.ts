import { auth } from "@/lib/firebase";
import { Capacitor } from "@capacitor/core";

const BILLING_BASE = import.meta.env.VITE_BILLING_URL ?? "http://localhost:4242";

async function authHeader() {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function syncEntitlements() {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeader()),
  };
  const response = await fetch(`${BILLING_BASE}/api/billing/sync-entitlements`, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Erro ao sincronizar assinatura.");
  }

  return response.json();
}

export function getSubscriptionManagementUrl() {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") {
    return "https://apps.apple.com/account/subscriptions";
  }
  if (platform === "android") {
    return "https://play.google.com/store/account/subscriptions";
  }
  return "https://play.google.com/store/account/subscriptions";
}

export function openSubscriptionManagement() {
  const url = getSubscriptionManagementUrl();
  window.location.href = url;
}
