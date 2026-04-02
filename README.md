# Wix ↔ HubSpot Integration

Bi-directional contact sync between Wix and HubSpot CRM with form lead capture and field mapping UI.

---

## Features

- **HubSpot OAuth 2.0** connect/disconnect from dashboard
- **Bi-directional contact sync** — Wix ↔ HubSpot with loop prevention and idempotency
- **Wix form submissions** → HubSpot contact with UTM/source attribution
- **Field mapping UI** — configure which fields sync in which direction

---

## Project Structure

```
wix-hubspot-integration/
├── backend/           # NestJS + Prisma
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── auth/          # HubSpot OAuth flow
│       ├── hubspot/       # HubSpot API service
│       ├── wix/           # Wix Contacts API service
│       ├── mappings/      # Field mapping CRUD
│       ├── sync/          # Bi-directional sync logic
│       ├── forms/         # Wix form submission handler
│       ├── webhooks/      # HubSpot webhook receiver
│       ├── prisma/        # Prisma service
│       └── common/        # Encryption, guards, logger
└── frontend/          # React + TypeScript + Vite
    └── src/
        ├── pages/
        │   ├── ConnectPage.tsx       # OAuth connect UI
        │   └── FieldMappingPage.tsx  # Field mapping table
        └── api/
            └── client.ts             # Typed API client
```

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- HubSpot developer account with an app configured

---

## Setup Instructions

### 1. Clone and install

```bash
git clone <repo-url>
cd wix-hubspot-integration

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure HubSpot App

1. Go to [HubSpot Developer Portal](https://developers.hubspot.com/)
2. Create a new app
3. Under **Auth**, set the redirect URI to: `http://localhost:3000/auth/hubspot/callback`
4. Required scopes: `crm.objects.contacts.read crm.objects.contacts.write`
5. Copy the **Client ID** and **Client Secret**

### 3. Set up environment variables

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/wix_hubspot_db"
PORT=3000
FRONTEND_URL=http://localhost:5173

JWT_SECRET=<generate a random 64-char string>
ENCRYPTION_KEY=<exactly 32 characters, e.g. your32charencryptionkey123456>

HUBSPOT_CLIENT_ID=<from HubSpot app>
HUBSPOT_CLIENT_SECRET=<from HubSpot app>
HUBSPOT_REDIRECT_URI=http://localhost:3000/auth/hubspot/callback
HUBSPOT_SCOPES=crm.objects.contacts.read crm.objects.contacts.write
HUBSPOT_WEBHOOK_SECRET=<from HubSpot app webhook settings>

WIX_API_KEY=<from Wix Developer Center>
WIX_ACCOUNT_ID=<your Wix account ID>
WIX_SITE_ID=<your Wix site ID>
```

### 4. Set up the database

```bash
cd backend

# Create the database
createdb wix_hubspot_db

# Push schema
npm run prisma:push

# Or run migrations
npm run prisma:migrate
```

### 5. Run the backend

```bash
cd backend
npm run start:dev
```

Backend runs at `http://localhost:3000`
Swagger docs at `http://localhost:3000/api/docs`

### 6. Run the frontend

```bash
cd frontend
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Usage Flow

### Connect HubSpot

1. Open `http://localhost:5173`
2. Enter your email and click **Register** to get a session
3. Click **Connect HubSpot** — you are redirected to HubSpot OAuth
4. Authorize the app — you are redirected back with a JWT token stored in `localStorage`

### Configure Field Mappings

1. Navigate to `/mappings`
2. Add rows mapping Wix fields to HubSpot properties
3. Set sync direction: Wix → HubSpot, HubSpot → Wix, or Bi-directional
4. Optionally set a transform (lowercase, trim)
5. Click **Save Mappings**

### Sync Contacts

**API calls (use your JWT token):**

```bash
# Wix → HubSpot
curl -X POST http://localhost:3000/sync/wix-to-hubspot \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"wixContactId": "abc123"}'

# HubSpot → Wix
curl -X POST http://localhost:3000/sync/hubspot-to-wix \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"hubspotContactId": "12345"}'
```

### Form Submission (Wix → HubSpot lead capture)

Call from your Wix form submission handler:

```bash
curl -X POST http://localhost:3000/forms/wix-submission \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lead@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "attribution": {
      "utmSource": "google",
      "utmMedium": "cpc",
      "utmCampaign": "summer-sale",
      "pageUrl": "https://mysite.com/landing",
      "referrer": "https://google.com"
    },
    "formId": "contact-form-1",
    "submittedAt": "2024-01-15T10:30:00Z"
  }'
```

### HubSpot Webhooks (HubSpot → Wix auto-sync)

Register `http://your-public-url/webhooks/hubspot` in your HubSpot app's webhook settings for `contact.creation` and `contact.propertyChange` events.

Use [ngrok](https://ngrok.com/) for local testing:

```bash
ngrok http 3000
# Use the HTTPS URL: https://abc123.ngrok.io/webhooks/hubspot
```

---

## Environment Variables Reference

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for signing JWT tokens | Yes |
| `ENCRYPTION_KEY` | 32-char key for encrypting OAuth tokens | Yes |
| `HUBSPOT_CLIENT_ID` | HubSpot app client ID | Yes |
| `HUBSPOT_CLIENT_SECRET` | HubSpot app client secret | Yes |
| `HUBSPOT_REDIRECT_URI` | OAuth callback URL | Yes |
| `HUBSPOT_SCOPES` | HubSpot OAuth scopes | Yes |
| `HUBSPOT_WEBHOOK_SECRET` | For verifying HubSpot webhook signatures | Optional |
| `WIX_API_KEY` | Wix API key | Yes |
| `WIX_ACCOUNT_ID` | Wix account ID | Yes |
| `WIX_SITE_ID` | Wix site ID | Yes |
| `PORT` | Backend port (default: 3000) | No |
| `FRONTEND_URL` | Frontend URL for CORS (default: http://localhost:5173) | No |

---

## Sample Test Credentials (Dummy)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wix_hubspot_db"
JWT_SECRET="test-jwt-secret-do-not-use-in-production-change-this"
ENCRYPTION_KEY="testencryptionkey1234567890abcd"
HUBSPOT_CLIENT_ID="00000000-0000-0000-0000-000000000000"
HUBSPOT_CLIENT_SECRET="00000000-0000-0000-0000-000000000000"
HUBSPOT_REDIRECT_URI="http://localhost:3000/auth/hubspot/callback"
HUBSPOT_SCOPES="crm.objects.contacts.read crm.objects.contacts.write"
WIX_API_KEY="IST.test.api.key"
WIX_ACCOUNT_ID="test-wix-account-id"
WIX_SITE_ID="test-wix-site-id"
```

---

## API Documentation

Swagger UI is available at `http://localhost:3000/api/docs` when the backend is running.

### Auth Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/hubspot/register` | Register user, get JWT |
| `GET` | `/auth/hubspot/connect` | Initiate HubSpot OAuth |
| `GET` | `/auth/hubspot/callback` | HubSpot OAuth callback |
| `POST` | `/auth/hubspot/disconnect` | Disconnect HubSpot |
| `GET` | `/auth/hubspot/status` | Check connection status |

### Mappings Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/mappings` | Get field mappings |
| `POST` | `/mappings` | Save field mappings |
| `DELETE` | `/mappings/:id` | Delete a mapping |
| `GET` | `/mappings/wix-fields` | List Wix fields |
| `GET` | `/mappings/hubspot-properties` | List HubSpot properties |

### Sync Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/sync/wix-to-hubspot` | Sync Wix → HubSpot |
| `POST` | `/sync/hubspot-to-wix` | Sync HubSpot → Wix |
| `GET` | `/sync/logs` | Get sync logs |

### Forms Endpoint

| Method | Path | Description |
|---|---|---|
| `POST` | `/forms/wix-submission` | Submit Wix form → HubSpot |

### Webhooks Endpoint

| Method | Path | Description |
|---|---|---|
| `POST` | `/webhooks/hubspot` | Receive HubSpot webhook events |

---

## Loop Prevention

Sync loops are prevented by:

1. **External ID mapping** — `ContactMapping` table links `wixContactId` ↔ `hubspotContactId`
2. **SyncId tracking** — each sync generates a UUID; in-memory set tracks active sync IDs
3. **Idempotency** — if `lastSyncedAt` is newer than the contact's `updatedAt`, sync is skipped
4. **Source tracking** — `lastSyncSource` indicates which system last wrote the contact

---

## Security Notes

- OAuth tokens are AES-256-CBC encrypted before storage
- Tokens are never returned to the frontend
- All protected endpoints require a valid JWT
- Webhook signatures are verified using HMAC-SHA256
- PII and tokens are redacted from logs
