# Collective Wisdom

Autonomous AI Diagnostics & Digital Triplet Control Room for industrial manufacturing operations.

[![Node.js](https://img.shields.io/badge/Node.js-22%20LTS-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28.svg?logo=firebase)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/Gemini-AI%20Diagnostics-4285F4.svg)](https://ai.google.dev/)

**Collective Wisdom** is a web-based AI diagnostics and digital triplet control room. It combines Google sign-in, Firestore-based operational records, collaborative incident feeds, and Gemini-powered diagnostic support for manufacturing and logistics teams.

---

## Key Features

- **Google Authentication** through Firebase Authentication.
- **Collaborative incident feed** for operator, quality, logistics, and maintenance communication.
- **Digital triplet dashboard** for monitoring equipment status, telemetry, and operational warnings.
- **Knowledge nodes** for storing SOPs, lessons learned, and technical guidance.
- **Gemini AI diagnostics** for AI-assisted incident analysis and recovery recommendations.
- **Firestore backend** for incidents, knowledge records, telemetry data, and dashboard statistics.

---

## Technology Stack

| Layer | Main tools |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, `tsx` |
| Authentication | Firebase Authentication with Google provider |
| Database | Cloud Firestore |
| AI | Google Gemini API, Google ADK |
| Deployment target | Google Cloud Run, GitHub Actions |

---

## Local Development Setup

This guide assumes that you are running the app on Windows using VS Code.

### 1. Install Node.js

Install **Node.js LTS** from the official Node.js website. The installer also includes `npm`.

After installation, restart VS Code and check:

```bash
node -v
npm.cmd -v
```

If PowerShell blocks `npm`, use `npm.cmd` instead.

---

### 2. Install project dependencies

Open the project folder in VS Code. The folder must contain:

```text
package.json
server.ts
db.ts
src/
.env.example
```

Then run:

```bash
npm.cmd install
```

---

## Environment Variables

Create a file named `.env` in the project root.

Do **not** upload `.env` to GitHub.

### Required `.env` format

```env
# Gemini API key for AI diagnostics
GEMINI_API_KEY="your_gemini_api_key"

# Local app URL
APP_URL="http://localhost:3000"

# Firebase Web App configuration
VITE_FIREBASE_API_KEY="your_firebase_web_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_firebase_app_id"
```

### Notes

- `GEMINI_API_KEY` comes from **Google AI Studio**.
- `VITE_FIREBASE_*` values come from **Firebase Console → Project settings → General → Your apps → Web app**.
- `APP_URL` should be `http://localhost:3000` because this project runs through `server.ts`, not the default Vite port.

---

## Firebase Setup

The app needs three Firebase components:

1. Firebase Authentication
2. Cloud Firestore
3. Firebase Admin SDK service account key

### 1. Create a Firebase project

Go to Firebase Console and create a project, for example:

```text
Collective Wisdom
```

Google Analytics is optional for local testing.

---

### 2. Register a Web App

In Firebase Console:

```text
Project settings → General → Your apps → Web app
```

Register a web app, for example:

```text
collective-wisdom-web
```

Copy the Firebase config values into `.env` using the `VITE_FIREBASE_*` names shown above.

---

### 3. Enable Google Authentication

In Firebase Console:

```text
Security → Authentication → Get started → Sign-in method → Google
```

Then:

1. Enable Google sign-in.
2. Set a public-facing project name, for example `Collective Wisdom`.
3. Select your support email.
4. Save.

Also confirm that `localhost` is listed under:

```text
Authentication → Settings → Authorized domains
```

---

### 4. Create Cloud Firestore

In Firebase Console:

```text
Databases & Storage → Firestore
```

Choose:

```text
Standard edition
Start in test mode
```

Select a nearby location, such as:

```text
asia-northeast1
```

Firestore test mode is acceptable for local development. For production, replace test rules with secure rules.

---

### 5. Add Firebase Admin SDK credentials

The backend uses Firebase Admin SDK to access Firestore.

In Firebase Console:

```text
Project settings → Service accounts → Firebase Admin SDK → Generate new private key
```

Download the JSON file, then rename it to:

```text
serviceAccountKey.json
```

Place it in the project root, at the same level as:

```text
package.json
server.ts
db.ts
.env
serviceAccountKey.json
```

The backend should point to this file in `db.ts`:

```ts
const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
```

When the file is detected correctly, the terminal should show:

```text
Initializing Firebase Admin using local service account key...
```

It should not show:

```text
Local service account key not found
```

---

## Running the App Locally

Start the development server:

```bash
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

The app should display the Collective Wisdom login screen. After Google sign-in, the dashboard should load data from Firestore.

---

## Common Setup Errors

### `npm is not recognized`

Node.js is not installed, or VS Code was opened before Node.js was added to PATH.

Fix:

```text
Install Node.js LTS → restart VS Code → run node -v and npm.cmd -v
```

---

### `npm.ps1 cannot be loaded because running scripts is disabled`

PowerShell blocked the `npm` script.

Use:

```bash
npm.cmd install
npm.cmd run dev
```

---

### `Cannot find package.json`

The terminal is in the wrong folder.

Open the project folder in VS Code or run:

```bash
cd "path_to_collective_wisdom_project"
```

Then confirm:

```bash
dir package.json
```

---

### `API key must be provided via GEMINI_API_KEY`

The Gemini key is missing from `.env`.

Fix:

```env
GEMINI_API_KEY="your_gemini_api_key"
```

Then restart the server.

---

### `Firebase: Error (auth/invalid-api-key)`

The Firebase Web App variables are missing or wrong.

Check:

```env
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Then restart the server.

---

### `Firebase: Error (auth/configuration-not-found)`

Google sign-in is not enabled in Firebase Authentication.

Fix:

```text
Firebase Console → Authentication → Sign-in method → Google → Enable
```

---

### `/api/stats 500`, `/api/incidents 500`, or `/api/knowledge 500`

The backend cannot read Firestore.

Check these items:

1. Firestore database has been created.
2. `serviceAccountKey.json` is in the project root.
3. `db.ts` points to `serviceAccountKey.json`.
4. The server was restarted after adding the key.

If the terminal says:

```text
Unable to detect a Project Id in the current environment
```

then the Firebase Admin service account key is missing, incorrectly named, or not detected.

---

## Protecting Secrets Before GitHub Upload

Before uploading the project to GitHub, confirm that `.gitignore` contains:

```gitignore
node_modules/
dist/
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Firebase and Google Cloud keys
serviceAccountKey.json
collective-wisdom-firebase-adminsdk-*.json
collective-bento-firebase-adminsdk-*.json
*-firebase-adminsdk-*.json
*.private.json
*.key
*.pem
```

Never commit:

```text
.env
serviceAccountKey.json
Firebase Admin SDK JSON files
Gemini API keys
```

---

## Build and Quality Check

Run a TypeScript check:

```bash
npm.cmd run lint
```

Build the app:

```bash
npm.cmd run build
```

Run the production build locally:

```bash
npm.cmd start
```

---

## GitHub Upload

After confirming that private files are ignored, upload the project:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
git push -u origin main
```

Before pushing, check what Git will upload:

```bash
git status
```

Make sure these files do not appear:

```text
.env
serviceAccountKey.json
```

---

## Production Deployment Notes

This project can be deployed to Google Cloud Run. For production deployment, configure secrets and environment variables in the hosting platform rather than committing them into the repository.

Required production environment variables:

```env
GEMINI_API_KEY="production_gemini_key"
APP_URL="https://your-cloud-run-url"

VITE_FIREBASE_API_KEY="production_firebase_web_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_firebase_app_id"
```

For backend Firestore access in production, use a secure service account method provided by Google Cloud Run or GitHub Actions. Do not store service account keys directly in the repository.

---

## Project Naming

The current project name is:

```text
Collective Wisdom
```

Use this visible name in the UI, Firebase public-facing project name, README, and deployment labels.

Use this technical identifier where lowercase IDs are needed:

```text
collective-wisdom
```

---

## License

Add your license information here.
