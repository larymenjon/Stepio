# Stepio Billing Server (RevenueCat)

## Variáveis de ambiente

Configure estas variáveis no host (Render) e no local (arquivo `.env` separado para o servidor):

```
REVENUECAT_API_KEY=sk_...
REVENUECAT_ENTITLEMENT_ID=pro
REVENUECAT_WEBHOOK_AUTH=Bearer rc_webhook_secret
APP_URL=http://localhost:8080
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

## Firebase service account

No Firebase Console:
- Project Settings → Service accounts → Generate new private key
- Copie o JSON e use em `FIREBASE_SERVICE_ACCOUNT` (em uma linha).

## Rodar local

```
npm install
npm run dev:server
```

## Webhook RevenueCat

Depois de subir o servidor, configure o webhook no RevenueCat:

- URL: `https://SEU_SERVIDOR/webhook/revenuecat`
- Authorization (opcional): use o mesmo valor de `REVENUECAT_WEBHOOK_AUTH`.
