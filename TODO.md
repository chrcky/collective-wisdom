# Collective Bento — Operational Launch Roadmap (TODO)

This document outlines the engineering, design, and operational tasks required to transform this unified Express + React prototype into a fully functional, production-grade Industrial IoT Triage & Diagnostics platform.

---

## 📋 Table of Contents
- [Phase 1: Security, Roles & Access Control](#phase-1-security-roles--access-control)
- [Phase 2: Live Ingestion & Real-Time Telemetry](#phase-2-live-ingestion--real-time-telemetry)
- [Phase 3: Complete Triage & Incident Workflow](#phase-3-complete-triage--incident-workflow)
- [Phase 4: Advanced AI Agent & Knowledge Grounding](#phase-4-advanced-ai-agent--knowledge-grounding)
- [Phase 5: Production Hardening, DevOps & Alerting](#phase-5-production-hardening-devops--alerting)

---

## 🔒 Phase 1: Security, Roles & Access Control
Ensure the platform is safe and compliant with industrial access requirements.

- [ ] **Restrict Registration Domains**
  - Limit login capability strictly to verified company emails (e.g., `*@nerdter.com` or `*@collectivebento.com`) within Firebase Auth.
  - Implement a Firebase Auth blocking function or security rule to automatically reject unapproved sign-ups.
- [ ] **Implement Role-Based Access Control (RBAC)**
  - Assign user roles in Firestore custom user documents or Firebase custom claims:
    - `Operator`: View telemetry, comment on incidents, trigger diagnostics.
    - `Technician`: Edit setpoints, log mechanical repairs, update manual entries.
    - `Shift Supervisor`: Assign incidents, approve calibration changes, override alarms.
    - `Admin`: Full system settings and API token management.
  - Update React frontend routes and UI elements to conditionally render based on these user roles.
- [ ] **Secure API Endpoints**
  - Add JWT validation middleware to all Express `/api/*` endpoints to verify that requests contain a valid Firebase ID token.
  - Ensure users can only modify records they are authorized to touch based on their verified role.

---

## 📈 Phase 2: Live Ingestion & Real-Time Telemetry
Transition from static seeded database records to real-time streaming industrial data.

- [ ] **Establish IoT Data Ingestion Endpoint**
  - Create a lightweight Express ingest route (e.g., `POST /api/telemetry/ingest`) to receive sensor telemetry from physical gateways or edge devices (using MQTT-to-HTTP bridges).
  - Secure this endpoint with API key/HMAC signature verification.
- [ ] **Implement WebSockets for Live Updates**
  - Integrate a Socket.io or native WebSocket server alongside Express to push fresh sensor readings (temp, vibration, throughput) to connected client dashboards.
  - Update Recharts components in the frontend to tick in real-time as data streams in.
- [ ] **Real-Time Discussion using Firestore Listeners**
  - Replace the current HTTP polling/refresh model in `App.tsx` with Firestore real-time listeners (`onSnapshot`) for incidents and messages.
  - Ensure operators instantly see messages added by other team members or the AI Agent.

---

## 🛠️ Phase 3: Complete Triage & Incident Workflow
Enhance the daily work execution tools for operators and engineers.

- [ ] **Incident Assignment and Ownership**
  - Add an "Owner" field to the incident schema mapping to specific team members.
  - Enable Supervisors to assign incidents to available Technicians with in-app notifications.
- [ ] **Expand Status Lifecycle**
  - Expand the simple `Active` / `Resolved` states to reflect real floor workflows:
    - `Triaging` ➡️ `Investigating` ➡️ `Calibrating` ➡️ `Testing` ➡️ `Resolved`.
  - Log audit trails in Firestore showing who changed the status and when.
- [ ] **Media Uploads for Floor Failures**
  - Integrate Firebase Storage or Google Cloud Storage.
  - Allow technicians to upload photos or thermal imaging screenshots of damaged machinery directly into the incident chat.

---

## 🧠 Phase 4: Advanced AI Agent & Knowledge Grounding
Evolve the Gemini Co-Pilot from basic prompt generation into a highly context-aware expert system.

- [ ] **RAG (Retrieval-Augmented Generation) on PDF Manuals**
  - Load official machine manuals, wiring schematics, and standard operating procedures (SOPs) into a Firestore Vector Database or Vertex AI Vector Search.
  - Update the ADK knowledge-search agent to perform vector searches on user queries to pull exact paragraphs from manuals rather than relying solely on abstract node summaries.
- [ ] **Historical Incident Correlation**
  - Allow the diagnostic agent to automatically search past "Resolved" incidents to identify similar historic failures and report how they were solved.
- [ ] **Structured Mechanical Control Outputs**
  - Update the agent to generate formal control system setpoint configurations (e.g. PLC register commands) so that supervisors can review and execute calibrations directly through the UI.

---

## 🚀 Phase 5: Production Hardening, DevOps & Alerting
Bridge the gap between deployment success and operational reliability.

- [ ] **Configure Automated Cloud Backups**
  - Set up a daily export schedule for the production Firestore database to a secured Cloud Storage bucket.
- [ ] **Centralized Logging & Audit Trails**
  - Replace `console.log` statements in the Express backend with a production-grade logger like `winston`.
  - Export system and API access logs to **Google Cloud Logging (Winston-to-GCP)** for compliance and troubleshooting.
- [ ] **Alerting Pipeline (SMS/Email)**
  - Integrate SendGrid or Twilio API.
  - Automatically dispatch an SMS or high-priority Email alert to the on-call Technician whenever a telemetry stream triggers a `Critical` or `Urgent` threshold.
- [ ] **CI/CD Pipeline Security Scanning**
  - Add security scanning steps (like `npm audit` and code linting) directly to the GitHub Actions `.github/workflows/deploy.yml` to prevent pushing vulnerable dependencies or broken types.
