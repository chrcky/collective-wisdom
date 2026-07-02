# collective-wisdom
Autonomous AI Diagnostics & Digital Triplet Control Room

[![Node.js](https://img.shields.io/badge/Node.js-22%20LTS-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vite.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS-v4.0-38B2AC.svg)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28.svg?logo=firebase)](https://firebase.google.com/)

**Collective Wisdom** is a modern, high-fidelity Autonomous AI Diagnostics & Digital Triplet control room platform designed for high-availability industrial manufacturing plants. It couples real-time sensory log monitoring, cooperative Expert Hub chats, and automated anomaly resolution runbooks utilizing Google Gemini AIs.



https://github.com/user-attachments/assets/cecd6514-b260-4c15-bcaa-2ed682b57e81


---

## 🏗️ Swimlane System Architecture

The following diagram illustrates how user actions across roles flow from inputs down into frontend layout triggers, backend endpoint execution, autonomous Gemini AI model reasoning, and persistent Firestore collections.

```mermaid
graph LR
    %% Subgraph Styling Definitions
    classDef userStyle fill:#fafafa,stroke:#64748b,stroke-width:2px,color:#0f172a;
    classDef feStyle fill:#f0fdfa,stroke:#0d9488,stroke-width:2px,color:#0f172a;
    classDef beStyle fill:#f0f7ff,stroke:#0284c7,stroke-width:2px,color:#0f172a;
    classDef aiStyle fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#0f172a;
    classDef dbStyle fill:#fff7ed,stroke:#ea580c,stroke-width:2px,color:#0f172a;

    subgraph UserSpace ["👤 Operator & Supervisor Inputs"]
        direction TB
        U_Auth["🔑 Google Credentials Sign-In"]
        U_Monitor["📊 View Real-Time Sensory Logs"]
        U_Triage["📝 Log Manual Mechanical Incident"]
        U_RequestAI["💬 Invoke Multi-Turn AI Diagnostics"]
        U_Resolve["✅ Execute Repair & Recalibration"]
        U_SearchKB["🔍 Query Grounded SOP Nodes"]
        U_Demo["🚀 Run Walkthrough Investor Demo"]
    end

    subgraph FE ["💻 Frontend UI Layer (React + Tailwind)"]
        direction TB
        FE_Auth["🔐 Firebase Identity Verification Guard"]
        FE_Dashboard["🖥️ Glassmorphic Control Room Center"]
        FE_Triplet["📈 Live Digital Triplet (Recharts Visuals)"]
        FE_Feed["🗣️ Operator Collaborative Chats & Incidents"]
        FE_KB["📚 SOP Knowledge Base Viewer Panel"]
        FE_Demo["🎬 Automated Demo Slideshow Walkthrough"]
    end

    subgraph BE ["⚙️ Express Backend Gateway Server"]
        direction TB
        BE_AuthGuard["🔒 Custom Firebase JWT Auth Middleware"]
        BE_Telemetry["📡 Telemetry Streamer & Stats Route"]
        BE_Incidents["📋 Incidents Registry (Create/Resolve)"]
        BE_KB_Api["📂 SOP Knowledge Base API Handler"]
        BE_Agent["🤖 AI Diagnostic Orchestration Core"]
    end

    subgraph AI ["🧠 Autonomous Gemini AI Engine"]
        direction TB
        AI_Context["🔄 Context Aggregator & System Guidelines"]
        AI_Model["🧠 Gemini Pro (via @google/genai)"]
        AI_Output["📦 JSON Parsing (Analysis, Offsets, Lessons)"]
    end

    subgraph DB ["🗄️ Firestore Database & Memory Storage"]
        direction TB
        DB_Telemetry["🗃️ Telemetry Streams & Device Readings"]
        DB_Incidents["🗃️ Incidents Log & Message History"]
        DB_KB["🗃️ Grounded SOPs & AI Lessons-Learned"]
    end

    %% Apply Classes
    class U_Auth,U_Monitor,U_Triage,U_RequestAI,U_Resolve,U_SearchKB,U_Demo userStyle;
    class FE_Auth,FE_Dashboard,FE_Triplet,FE_Feed,FE_KB,FE_Demo feStyle;
    class BE_AuthGuard,BE_Telemetry,BE_Incidents,BE_KB_Api,BE_Agent beStyle;
    class AI_Context,AI_Model,AI_Output aiStyle;
    class DB_Telemetry,DB_Incidents,DB_KB dbStyle;

    %% Connect User Space to Frontend Layer
    U_Auth --> FE_Auth
    U_Monitor --> FE_Triplet
    U_Triage --> FE_Feed
    U_RequestAI --> FE_Feed
    U_Resolve --> FE_Feed
    U_SearchKB --> FE_KB
    U_Demo --> FE_Demo

    %% Connect Frontend to Backend
    FE_Auth -->|JWT Token| BE_AuthGuard
    FE_Dashboard -->|GET /api/stats| BE_Telemetry
    FE_Triplet -->|GET /api/incidents| BE_Telemetry
    FE_Feed -->|POST /api/incidents| BE_Incidents
    FE_Feed -->|POST /api/agent/analyze| BE_Agent
    FE_Feed -->|POST /api/incidents/:id/resolve| BE_Incidents
    FE_KB -->|GET /api/knowledge| BE_KB_Api
    FE_Demo -->|Auto Sequencer Actions| FE_Feed

    %% Connect Backend to Database
    BE_Telemetry -->|Read| DB_Telemetry
    BE_Incidents -->|Write / Update| DB_Incidents
    BE_KB_Api -->|Read| DB_KB

    %% Connect Backend to AI & AI to Database
    BE_Agent -->|Compile Payload| AI_Context
    AI_Context -->|Query & Instructions| AI_Model
    AI_Model -->|Return Text JSON| AI_Output
    AI_Output -->|Parse & Return Runbook| BE_Agent
    BE_Agent -->|Save Response Comment| DB_Incidents
    BE_Agent -->|Persist Extract Lessons Learned| DB_KB

    %% Real-time Sync and Loop Closure
    DB_Incidents -.->|Reactive Sync| FE_Feed
    DB_Telemetry -.->|Real-time Poll/Stream| FE_Triplet
```
---

## 🤖 ADK Multi-Agent Collaboration Loop

The platform leverages two specialized AI Agents orchestrated via the **Google ADK (`@google/adk`)** library. They collaborate through a persistent feedback loop, creating an expert learning flywheel that captures on-the-floor expertise and dynamically updates the plant's operational memory.

```mermaid
graph TD
    %% Styling definitions
    classDef operatorStyle fill:#fafafa,stroke:#64748b,stroke-width:2px,color:#0f172a;
    classDef diagStyle fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#0f172a;
    classDef knowStyle fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#0f172a;
    classDef storeStyle fill:#fff7ed,stroke:#ea580c,stroke-width:2px,color:#0f172a;

    %% Nodes
    Operator(["👤 Plant Operator / Supervisor"])
    
    subgraph ADK_Core ["Google ADK Orchestration Core"]
        DiagAgent["🧠 diagnostics-agent<br/>(AI Diagnostics & Runbooks)"]
        KnowAgent["🧠 knowledge-agent<br/>(SOP Synthesis & Search)"]
    end

    subgraph Store ["Shared Knowledge & Incident Ledger"]
        IncidentsDB[("🗃️ Incident Chat & Telemetry")]
        KnowledgeDB[("🗃️ Grounded SOPs & Manuals")]
    end

    %% Apply Classes
    class Operator operatorStyle;
    class DiagAgent diagStyle;
    class KnowAgent knowStyle;
    class IncidentsDB,KnowledgeDB storeStyle;

    %% Flows
    Operator -->|1. Triggers Diagnostics| DiagAgent
    Operator -->|4. Queries SOPs & Technical Specs| KnowAgent

    %% Diagnostics Agent Interactions
    DiagAgent -->|Reads Telemetry & History| IncidentsDB
    DiagAgent -->|2. Posts Diagnosis & Recalibration| IncidentsDB
    DiagAgent -->|3. Extracts 'Lessons Learned' SOP| KnowledgeDB

    %% Knowledge Agent Interactions
    KnowledgeDB -->|Loads Contextual SOPs & AI Lessons| KnowAgent
    KnowAgent -->|5. Delivers Grounded Expert Guide| Operator

    %% Real-Time Operator Loop
    IncidentsDB -.->|Updates Real-time Dashboard| Operator
```

### 🔁 Operational Flywheel Dynamics:
1. **Anomaly & Diagnosis**: When a sensory limit is breached, the operator invokes the `diagnostics-agent`. It analyzes real-time sensor metrics and outputs a precise recalibration proposal (recalibration steps, temperature offsets, safety comments).
2. **Knowledge Synthesis**: If the `diagnostics-agent` identifies a novel mechanical resolution pattern, it extracts an operational **"Lesson Learned"** as a structured summary.
3. **Database Grounding**: This lesson is automatically written as a new **Knowledge Node** in the plant's database.
4. **Contextual Grounding**: When operators ask technical questions, the `knowledge-agent` reads the global manuals along with the *newly synthesized AI lessons*, producing up-to-date, grounded troubleshooting guides in real time.

---

## ✨ Core Capabilities

*   **Google Identity Protection**: Access-restricted dashboard using Google Firebase Authentication and premium, glassmorphic login guards.
*   **Active Operator Dropdown**: Interactive navigation header displaying live Google profile details, real-time activity status, and secure signOut toggles.
*   **Digital Triplet sensory tracking**: Monitor continuous mechanical line signals (e.g. `CNV-01`, `Sens-1`) with status trackers.
*   **Cooperative Operator Feed**: Real-time expert chat feeds allowing operator-to-operator and operator-to-AI diagnosis tracking.
*   **Gemini AI Diagnosis Integration**: Invoke custom telemetry summaries, automated risk analyses, and actionable recovery recommendations via the Google `@google/genai` library.

---

## 🛠️ Local Development

### Prerequisites
*   **Node.js 22 LTS** or newer
*   **Google Cloud SDK (`gcloud` CLI)** — optional, but recommended for credential handling
*   A **Firebase Project** with Google Authentication and Cloud Firestore enabled

### 1. Repository Setup & Dependencies
Clone the repository and install the production/development dependencies:
```bash
npm install
```

### 2. Configure Local Environment Variables
Create a `.env` file in the project root:
```env
# Google Gemini API Access (Required for AI diagnostic operations)
GEMINI_API_KEY="your_gemini_api_key"

# Application Endpoint (used for callbacks and links)
APP_URL="http://localhost:3000"
```

### 3. Setup Database Credentials
By default, the backend connects to Cloud Firestore. 
*   **Service Account Option**: Place your downloaded Service Account key file (`collective-bento-firebase-adminsdk-fbsvc-*.json`) in the project root. The backend will automatically detect and bind to it.
*   **Application Default Credentials (ADC)**: Alternatively, log in via your local shell to automatically forward credentials to the application:
    ```bash
    gcloud auth application-default login
    ```

### 4. Running the Dev Server
Launch the unified development build (launches both the Vite frontend dev compiler and the Express API server):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live dashboard.

---

## 🧪 Testing & Code Quality

Validate TypeScript definitions, lint-rules, and compile targets:

*   **Type Check & Linting**:
    ```bash
    npm run lint
    ```
*   **Production Bundling**:
    ```bash
    npm run build
    ```

---

## 🚀 Production Deployment (Google Cloud Run & GitHub Actions)

The application incorporates a robust GitHub Actions deployment pipeline located in `.github/workflows/deploy.yml`. The pipeline automates multi-stage Docker builds, pushes the container to Artifact Registry, and deploys it to Cloud Run on pushes to the `main` branch.

### 1. GitHub Repository Variables
Configure these variables under **Settings** ➔ **Secrets and variables** ➔ **Actions** ➔ **Variables**:

*   `PROJECT_ID`: Your Google Cloud project ID (e.g., `collective-bento`).
*   `SERVICE_NAME`: The target Google Cloud Run service name (e.g., `collective-bento-service`).
*   `REGION`: The target deployment region (e.g., `us-central1`).
*   `DOCKER_IMAGE_URL`: Your Google Artifact Registry Docker image destination link (e.g., `us-central1-docker.pkg.dev/collective-bento/collective-bento-repo/collective-bento`).
*   `VITE_API_URL`: The production endpoint url of your Cloud Run instance.

### 2. GitHub Repository Secrets
Configure this variable under **Settings** ➔ **Secrets and variables** ➔ **Actions** ➔ **Secrets**:

*   `GCP_SA_KEY`: The raw text contents of your GCP Service Account JSON key file. 
    *(Requires roles: Artifact Registry Writer, Cloud Run Developer, Service Account User).*

### 3. Setting Gemini API Key on Cloud Run
To enable Gemini AI capabilities in production, set the environment variable on your Cloud Run Service:
1. Navigate to your Service on the **Cloud Run Console**.
2. Select **Edit & Deploy New Revision**.
3. Under the **Variables** tab, add a new environment variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: *[Your active Google Gemini API Key]*
4. Click **Deploy**.
