# Software Requirements Specification (SRS)

## Kasthataka Sahayaka — GenAI Finger Millet Disease Detection & Advisory Platform

| Field               | Value                                                              |
| ------------------- | ------------------------------------------------------------------ |
| **Document ID**     | SRS-KS-001                                                         |
| **Version**         | 1.0                                                                |
| **Date**            | 18 August 2026                                                     |
| **Author**          | Yaswanth Jyothula                                                  |
| **Status**          | Draft                                                              |
| **Derived From**    | SRS-WEB-AGRI-004 (LTTS Smart Agriculture)                          |
| **Repository**      | https://github.com/yaswanthjyothula/kasthataka_sahayaka             |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features & Functional Requirements](#3-system-features--functional-requirements)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Use Cases](#6-use-cases)
7. [Data Requirements](#7-data-requirements)
8. [Appendix A — Disease Classification Taxonomy](#appendix-a--disease-classification-taxonomy)
9. [Appendix B — Requirements Traceability Matrix](#appendix-b--requirements-traceability-matrix)
10. [Appendix C — Glossary](#appendix-c--glossary)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the complete functional and non-functional requirements for **Kasthataka Sahayaka**, a cloud-native Progressive Web Application (PWA) designed for real-time finger millet (*Eleusine coracana* / ragi) crop disease detection, explainable visual diagnostics, generative agronomical advisory, deterministic chemical-safety guardrails, weather-based pathogen risk forecasting, and multilingual farmer support.

The document serves as the binding contract between stakeholders (agricultural extension officers, agronomists, smallholder farmers) and the development team for all phases of the platform build.

### 1.2 Scope

**Kasthataka Sahayaka** provides:

- **AI-powered disease detection** for 8 classes of finger millet diseases using deep learning vision models.
- **Explainable AI (XAI)** visual overlays (Score-CAM heatmaps) so farmers and officers understand *why* a diagnosis was made.
- **Generative advisory engine** grounded on ICAR/UAS agronomy documentation with a deterministic CIBRC pesticide-safety guardrail layer.
- **Weather-fused pathogen risk index** combining 72-hour humidity, leaf wetness, and temperature forecasts with disease vulnerability models.
- **Multilingual voice-first interface** supporting 7 Indian languages (Kannada, Telugu, Tamil, Marathi, Odia, Hindi, English).
- **Offline-first PWA** with IndexedDB queuing and Background Sync for rural 2G/3G connectivity.
- **Multi-persona role-based access** (Farmer, Extension Officer, Agronomist/Admin).

### 1.3 Intended Audience

| Audience                     | Usage                                                    |
| ---------------------------- | -------------------------------------------------------- |
| Smallholder Farmers          | 1-tap disease capture, voice advisory, vernacular UI     |
| Extension Officers           | Batch photo ingestion, field visit queue management      |
| Agronomists / Administrators | Regional GIS outbreak mapping, RBAC, RAG curation        |
| Development Team             | Implementation reference and testing acceptance criteria |
| QA / Test Engineers          | Test case derivation from functional requirements        |

### 1.4 Definitions, Acronyms & Abbreviations

| Term       | Definition                                                                      |
| ---------- | ------------------------------------------------------------------------------- |
| CIBRC      | Central Insecticides Board & Registration Committee (India)                     |
| PWA        | Progressive Web Application                                                    |
| XAI        | Explainable Artificial Intelligence                                            |
| Score-CAM  | Score-weighted Class Activation Mapping                                        |
| RAG        | Retrieval-Augmented Generation                                                 |
| ICAR       | Indian Council of Agricultural Research                                        |
| UAS        | University of Agricultural Sciences                                            |
| STT / TTS  | Speech-to-Text / Text-to-Speech                                               |
| GIS        | Geographic Information System                                                  |
| RBAC       | Role-Based Access Control                                                      |
| WASM       | WebAssembly                                                                    |
| Qdrant     | Open-source vector similarity search engine                                    |
| PostGIS    | Spatial database extension for PostgreSQL                                      |

### 1.5 References

- SRS-WEB-AGRI-004 — Original LTTS Smart Agriculture Requirements Document
- CIBRC Major Uses of Pesticides (9th Edition) — Government of India
- ICAR Finger Millet Production Technology Guidelines
- IEEE Std 830-1998 — Recommended Practice for Software Requirements Specifications

---

## 2. Overall Description

### 2.1 Product Perspective

Kasthataka Sahayaka is a standalone cloud-native application that operates as a monorepo containing:

```
kasthataka_sahayaka/
├── docs/                          # SRS, SDD, and reference documentation
├── backend/                       # FastAPI (Python 3.11+, async)
│   ├── app/
│   │   ├── core/                  # Pydantic configuration & JWT security
│   │   ├── api/v1/endpoints/      # Health, Auth, Ingestion, Detection, XAI, Advisory, Weather
│   │   └── main.py               # Application entry with CORS
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                      # Next.js 14 App Router + TailwindCSS (mobile-first)
│   ├── src/
│   │   ├── app/                   # Layout, Landing Page, Dashboard
│   │   └── components/            # Reusable UI components (HealthBadge)
│   ├── public/                    # PWA manifest, landing.html, static assets
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml             # Local dev stack (Frontend, Backend, PostgreSQL/PostGIS, Qdrant)
└── README.md
```

The system integrates with:
- **Triton Inference Server** for PyTorch/ONNX model serving
- **Qdrant Vector Database** for RAG-based advisory retrieval
- **PostgreSQL + PostGIS** for spatial farmer/field records
- **Tomorrow.io / OpenWeatherMap** for agricultural weather data
- **Web Speech API / Bhashini** for multilingual voice I/O

### 2.2 Product Functions (High-Level)

| ID   | Function                              | Description                                                                          |
| ---- | ------------------------------------- | ------------------------------------------------------------------------------------ |
| PF-1 | Crop Disease Detection                | AI-powered leaf image analysis with 8-class disease classification                   |
| PF-2 | Smart Agriculture Calendar            | Automated crop-cycle scheduling (nursery, tillering, flowering, harvest)              |
| PF-3 | Resource Management                   | Tank-mix knapsack pump dosage calculator based on acreage and tank size               |
| PF-4 | Weather Forecasting                   | 72-hour pathogen proliferation vulnerability index                                   |
| PF-5 | Predictive Yield Analytics            | AI-estimated harvest loss based on necrotic leaf area ratio                           |
| PF-6 | Disease-Based Products (CIBRC Gate)   | Pre-approved chemical & bio-fungicide recommendations with safety guardrails          |
| PF-7 | Local Farmer Support                  | Multilingual voice-first advisory in 7 Indian languages                              |

### 2.3 User Classes and Characteristics

#### 2.3.1 Farmer (Primary Persona)
- **Technical Literacy**: Low to moderate; smartphone-literate but not app-savvy.
- **Connectivity**: Rural 2G/3G with intermittent connectivity.
- **Language**: Predominantly regional (Kannada, Telugu, Tamil, Hindi).
- **Interaction Model**: 1-tap capture, voice-first, large touch targets (minimum 48×48 dp), high-contrast UI.

#### 2.3.2 Extension Officer
- **Technical Literacy**: Moderate; trained on agricultural technology.
- **Connectivity**: Field visits with variable connectivity.
- **Interaction Model**: Batch photo ingestion, offline queue management across multiple field visits, manual diagnostic overrides.

#### 2.3.3 Agronomist / Administrator
- **Technical Literacy**: High; university-educated in agricultural science.
- **Connectivity**: Stable broadband.
- **Interaction Model**: Regional GIS outbreak mapping, spatial queries, RAG document curation, RBAC management, CSV data exports.

### 2.4 Operating Environment

| Component         | Specification                                                      |
| ----------------- | ------------------------------------------------------------------ |
| Client Devices    | Android 8.0+, iOS 14+, Chrome 90+, Firefox 88+, Edge 90+          |
| Server OS         | Linux (Ubuntu 22.04 LTS / Debian 12)                               |
| Container Runtime | Docker 24.x, Kubernetes 1.28+                                      |
| Database          | PostgreSQL 15 + PostGIS 3.3                                        |
| Vector Store      | Qdrant latest                                                      |
| ML Inference      | NVIDIA Triton Inference Server 2.x (GPU: CUDA 12.x)               |

### 2.5 Design and Implementation Constraints

| Constraint                         | Rationale                                                           |
| ---------------------------------- | ------------------------------------------------------------------- |
| CIBRC compliance is mandatory      | Legal requirement for pesticide recommendations in India            |
| Offline-first architecture         | Target users operate in rural areas with poor connectivity          |
| Minimum viewport support: 360px    | Smallest mainstream Android screen width                            |
| PWA installable                    | No Play Store dependency for distribution                           |
| All advisory must pass guardrails  | Patient-safety equivalent: wrong chemical advice harms crops/health |

### 2.6 Assumptions and Dependencies

1. Users have smartphones with rear cameras capable of ≥5 MP resolution.
2. Device browsers support `getUserMedia` API for live camera access.
3. Triton Inference Server is available for production model serving (dev uses mock responses).
4. CIBRC banned-pesticide lookup table is maintained and updated quarterly.
5. Weather API keys (Tomorrow.io or OpenWeatherMap) are provisioned for production.

---

## 3. System Features & Functional Requirements

### 3.1 FR-100: Crop Disease Detection & AI Chatbot

#### 3.1.1 Description
An interactive AI Crop Advisor chatbot interface where farmers can capture/upload leaf images, ask voice or text queries, and receive disease diagnosis with treatment recommendations.

#### 3.1.2 Functional Requirements

| ID       | Requirement                                                                                               | Priority |
| -------- | --------------------------------------------------------------------------------------------------------- | -------- |
| FR-101   | The system SHALL provide a live camera viewfinder modal using `navigator.mediaDevices.getUserMedia()` with rear-facing camera preference (`facingMode: 'environment'`). | High |
| FR-102   | The system SHALL display a bounding guide overlay ("Align leaf inside frame") on the camera viewfinder.     | Medium |
| FR-103   | The system SHALL capture a photo from the live video feed and attach it to the chatbot input as a JPEG image. | High |
| FR-104   | If `getUserMedia` is blocked or unavailable, the system SHALL fall back to native camera shutter via `<input type="file" accept="image/*" capture="environment">`. | High |
| FR-105   | The system SHALL accept image file uploads via a paperclip attachment button (📎) supporting JPEG, PNG, and WebP formats. | High |
| FR-106   | The system SHALL provide speech-to-text voice input using Web Speech API (`SpeechRecognition`) with language auto-detection based on selected locale. | High |
| FR-107   | The system SHALL display a pulsing red indicator when voice recording is active.                            | Medium |
| FR-108   | The system SHALL support 7 language locales for speech recognition: `kn-IN`, `te-IN`, `ta-IN`, `mr-IN`, `or-IN`, `hi-IN`, `en-US`. | High |
| FR-109   | The system SHALL display user and bot messages in a scrollable chat interface with sender avatars, timestamps, and image previews. | Medium |
| FR-110   | The system SHALL provide 4 quick-prompt suggestion chips for common disease queries.                       | Low |
| FR-111   | The system SHALL classify leaf images into one of 8 disease classes (see Appendix A) via backend inference. | High |
| FR-112   | The system SHALL assign a 4-tier severity grade (Grade 1–4) based on necrotic leaf area percentage.        | High |
| FR-113   | The system SHALL generate an XAI Score-CAM heatmap overlay highlighting the diagnostic region of interest. | Medium |

### 3.2 FR-200: Smart Agriculture Calendar

| ID       | Requirement                                                                                     | Priority |
| -------- | ----------------------------------------------------------------------------------------------- | -------- |
| FR-201   | The system SHALL display a seasonal crop calendar divided into growth stages: Nursery & Sowing (Days 0–20), Tillering & Blast Scouting (Days 21–50), Flowering & Grain Filling (Days 51–90). | High |
| FR-202   | Each calendar stage SHALL list actionable recommendations (seed treatment, weeding, disease scouting, fungicide timing). | High |
| FR-203   | The system SHALL allow farmers to input their sowing date and auto-calculate current growth stage. | Medium |

### 3.3 FR-300: Resource Management (Tank-Mix Calculator)

| ID       | Requirement                                                                                     | Priority |
| -------- | ----------------------------------------------------------------------------------------------- | -------- |
| FR-301   | The system SHALL accept land size input in acres (decimal precision 0.5).                        | High |
| FR-302   | The system SHALL accept knapsack pump size input in liters.                                      | High |
| FR-303   | The system SHALL compute: Total pumps needed = `ceil(acres × 4)`.                               | High |
| FR-304   | The system SHALL compute chemical dosage per tank: Tricyclazole 75% WP at 18g per 15L tank.     | High |
| FR-305   | The system SHALL compute total water volume: `acres × 200` liters.                              | High |
| FR-306   | All dosage recommendations SHALL pass the CIBRC Safety Guardrail before display.                 | Critical |

### 3.4 FR-400: Weather Forecasting (72h Pathogen Risk)

| ID       | Requirement                                                                                     | Priority |
| -------- | ----------------------------------------------------------------------------------------------- | -------- |
| FR-401   | The system SHALL display current relative humidity (%) with spore risk classification.           | High |
| FR-402   | The system SHALL display leaf wetness duration in hours with dew-point favorability status.      | High |
| FR-403   | The system SHALL display average temperature (°C) with fungal growth range indicator.            | High |
| FR-404   | The system SHALL fetch 72-hour weather forecasts from Tomorrow.io or OpenWeatherMap APIs.        | High |
| FR-405   | The system SHALL compute a composite pathogen proliferation vulnerability index from humidity, leaf wetness, and temperature. | Medium |
| FR-406   | The system SHALL trigger spray-timing alerts when vulnerability index exceeds a configurable threshold. | Medium |

### 3.5 FR-500: Predictive Yield Analytics

| ID       | Requirement                                                                                     | Priority |
| -------- | ----------------------------------------------------------------------------------------------- | -------- |
| FR-501   | The system SHALL display an uninfected baseline yield estimate (Quintals/Acre).                  | High |
| FR-502   | The system SHALL display projected yield loss (%) based on current disease grade classification. | High |
| FR-503   | The system SHALL display a protected harvest forecast after advisory intervention.               | High |
| FR-504   | Yield projections SHALL be computed using necrotic leaf area ratio models calibrated for finger millet. | Medium |

### 3.6 FR-600: Disease-Based Products (CIBRC Safety Gate)

| ID       | Requirement                                                                                         | Priority |
| -------- | --------------------------------------------------------------------------------------------------- | -------- |
| FR-601   | The system SHALL maintain a deterministic CIBRC banned-pesticide lookup table.                       | Critical |
| FR-602   | ALL chemical recommendations (LLM-generated or rule-based) SHALL be validated against the CIBRC lookup table BEFORE display to the user. | Critical |
| FR-603   | If a recommendation contains a banned chemical, the system SHALL rewrite the recommendation with an approved alternative or block it with a safety warning. | Critical |
| FR-604   | The system SHALL display CIBRC approval status badges ("✓ CIBRC Passed") for each product.          | High |
| FR-605   | The system SHALL list both bio-control agents and systemic chemical fungicides with dosage instructions. | High |

### 3.7 FR-700: Local Farmer Support (Multilingual Voice)

| ID       | Requirement                                                                                     | Priority |
| -------- | ----------------------------------------------------------------------------------------------- | -------- |
| FR-701   | The system SHALL provide a language selector dropdown supporting 7 languages: Kannada (ಕನ್ನಡ), Telugu (తెలుగు), Tamil (தமிழ்), Marathi (मराठी), Odia (ଓଡ଼ିଆ), Hindi (हिन्दी), English. | High |
| FR-702   | The system SHALL synthesize advisory text into speech (TTS) in the selected language.             | High |
| FR-703   | The system SHALL accept speech input (STT) in the selected language for query composition.        | High |
| FR-704   | Cloud TTS/STT fallback (Bhashini/Azure Speech) SHALL be used when browser Web Speech API is unsupported. | Medium |

### 3.8 FR-800: Authentication & Role-Based Access

| ID       | Requirement                                                                                     | Priority |
| -------- | ----------------------------------------------------------------------------------------------- | -------- |
| FR-801   | The system SHALL support OAuth2/JWT-based authentication with role assignment.                    | High |
| FR-802   | Three roles SHALL be supported: `farmer`, `officer`, `agronomist_admin`.                        | High |
| FR-803   | Each role SHALL have a persona-specific UI layout and feature set.                               | Medium |
| FR-804   | JWT tokens SHALL expire after 24 hours (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`).         | Medium |

### 3.9 FR-900: Image Ingestion Pipeline

| ID       | Requirement                                                                                     | Priority |
| -------- | ----------------------------------------------------------------------------------------------- | -------- |
| FR-901   | The system SHALL accept multipart image uploads via `POST /api/v1/ingestion/upload`.             | High |
| FR-902   | Each upload SHALL optionally include GPS coordinates (latitude, longitude) and text notes.        | Medium |
| FR-903   | Uploaded images SHALL pass a client-side WASM quality gate (OpenCV.js Laplacian blur variance > 100 threshold) before submission. | High |
| FR-904   | Images failing the blur quality gate SHALL be rejected with a "Too blurry — retake photo" message. | High |

### 3.10 FR-1000: Offline-First & PWA Capabilities

| ID        | Requirement                                                                                    | Priority |
| --------- | ---------------------------------------------------------------------------------------------- | -------- |
| FR-1001   | The application SHALL be installable as a PWA on Android and iOS devices.                       | High |
| FR-1002   | The system SHALL queue failed uploads in IndexedDB (`pending_sync` store) during connectivity loss. | Critical |
| FR-1003   | Queued items SHALL auto-flush via Background Sync API when connectivity is restored.            | Critical |
| FR-1004   | The PWA SHALL cache critical assets via Service Worker (Workbox) for offline shell rendering.   | High |

---

## 4. External Interface Requirements

### 4.1 User Interfaces

| Interface                  | Description                                                             |
| -------------------------- | ----------------------------------------------------------------------- |
| Landing Page               | Three.js WebGPU grass simulation with 120K blades, hero text, 4×2 disease grid, 3-step setup, Dashboard button |
| Dashboard                  | Full-screen white-theme sidebar layout with 7 feature tabs              |
| AI Crop Advisor Chatbot    | Chat interface with camera viewfinder, file upload, mic input, quick prompts |
| Camera Viewfinder Modal    | Live `getUserMedia` video feed with bounding guide and snap button      |

### 4.2 Hardware Interfaces

| Interface           | Specification                                             |
| ------------------- | --------------------------------------------------------- |
| Device Camera       | Rear-facing (`environment`) via MediaDevices API          |
| Device Microphone   | Audio capture via SpeechRecognition API                   |
| GPS / Location      | Geolocation API for field coordinate tagging              |

### 4.3 Software Interfaces

| Interface                  | Protocol  | Description                                         |
| -------------------------- | --------- | --------------------------------------------------- |
| FastAPI Backend             | HTTP/REST | JSON API at `http://localhost:8000/api/v1/*`         |
| Triton Inference Server     | gRPC/HTTP | Model inference for disease classification          |
| Qdrant Vector DB            | HTTP      | Vector similarity search at port `6333`             |
| PostgreSQL + PostGIS        | TCP       | Spatial data storage at port `5432`                 |
| Tomorrow.io / OpenWeather   | HTTPS     | Weather forecast data retrieval                     |
| Web Speech API              | Browser   | Client-side STT/TTS                                 |
| Bhashini / Azure Speech     | HTTPS     | Cloud STT/TTS fallback for unsupported browsers     |

### 4.4 Communication Interfaces

| Protocol | Usage                                                              |
| -------- | ------------------------------------------------------------------ |
| HTTPS    | All client–server communication (TLS 1.3 edge termination)        |
| WSS      | WebSocket for real-time advisory streaming (planned Phase 5)       |
| gRPC     | Triton Inference Server model invocation                           |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID      | Requirement                                                                       | Target         |
| ------- | --------------------------------------------------------------------------------- | -------------- |
| NFR-01  | Landing page First Contentful Paint (FCP)                                         | ≤ 2.0 seconds  |
| NFR-02  | Dashboard page Time to Interactive (TTI)                                          | ≤ 3.0 seconds  |
| NFR-03  | Camera viewfinder open-to-first-frame latency                                     | ≤ 1.5 seconds  |
| NFR-04  | Disease inference end-to-end (image upload → classification result)               | ≤ 4.0 seconds  |
| NFR-05  | Chat message response (simulated/mock)                                            | ≤ 1.0 second   |
| NFR-06  | Lighthouse Performance score                                                       | ≥ 90           |

### 5.2 Security

| ID      | Requirement                                                                       |
| ------- | --------------------------------------------------------------------------------- |
| NFR-07  | All API endpoints SHALL require JWT authentication (except `/health` and `/`).    |
| NFR-08  | JWT secrets SHALL be ≥256-bit and stored in environment variables, never in code. |
| NFR-09  | CORS SHALL be restricted to allowed origins only.                                 |
| NFR-10  | OWASP ZAP security scan SHALL pass with no HIGH or CRITICAL findings.             |
| NFR-11  | File uploads SHALL be validated for MIME type and maximum size (10 MB).            |
| NFR-12  | SQL injection prevention via parameterized queries (ORM-enforced).                |

### 5.3 Reliability & Availability

| ID      | Requirement                                                                       | Target         |
| ------- | --------------------------------------------------------------------------------- | -------------- |
| NFR-13  | System uptime SLA                                                                  | 99.5%          |
| NFR-14  | Offline mode SHALL gracefully degrade with full chat history and cached assets.    | —              |
| NFR-15  | Background Sync SHALL retry failed uploads up to 5 times with exponential backoff.| —              |

### 5.4 Scalability

| ID      | Requirement                                                                       | Target         |
| ------- | --------------------------------------------------------------------------------- | -------------- |
| NFR-16  | Kubernetes horizontal pod autoscaling for backend                                  | 2–20 replicas  |
| NFR-17  | Concurrent user load support                                                       | ≥ 500 users    |
| NFR-18  | Database connection pooling                                                        | 50 connections  |

### 5.5 Usability

| ID      | Requirement                                                                       |
| ------- | --------------------------------------------------------------------------------- |
| NFR-19  | All touch targets SHALL be ≥ 48×48 dp for Farmer persona.                         |
| NFR-20  | UI text SHALL be readable at arm's length (minimum 14px body text).               |
| NFR-21  | WCAG 2.1 AA color contrast ratio ≥ 4.5:1 for all text elements.                  |
| NFR-22  | Voice-first interaction SHALL be the primary mode for Farmer persona.             |

### 5.6 Compatibility

| ID      | Requirement                                                                       |
| ------- | --------------------------------------------------------------------------------- |
| NFR-23  | Support viewport range: 360px (mobile) to 1920px (desktop).                       |
| NFR-24  | Cross-browser testing: Chrome 90+, Firefox 88+, Safari 15+, Edge 90+.            |
| NFR-25  | Android WebView compatibility for PWA install.                                     |

---

## 6. Use Cases

### UC-01: Farmer Captures Leaf Image via Live Camera

| Field           | Description                                                           |
| --------------- | --------------------------------------------------------------------- |
| **Actor**       | Farmer                                                                |
| **Precondition**| Farmer is on the Dashboard → Crop Disease Detection tab               |
| **Trigger**     | Farmer taps the Camera (📷) button                                    |
| **Main Flow**   | 1. System opens a full-screen Camera Viewfinder modal.<br>2. System requests camera permission via `getUserMedia`.<br>3. Live video feed appears with bounding guide overlay.<br>4. Farmer aligns leaf within frame and taps "Snap Photo".<br>5. System captures the video frame as JPEG.<br>6. Modal closes; captured image appears as attachment in chatbot input.<br>7. Farmer taps Send; image is submitted for analysis. |
| **Alt Flow A**  | Camera permission denied → System shows error with "Open System Camera Shutter" fallback button → Opens native `<input capture>` |
| **Alt Flow B**  | `getUserMedia` unsupported → Same fallback as Alt Flow A              |
| **Postcondition** | Image is attached to chat and submitted to backend for inference    |

### UC-02: Farmer Uses Voice to Ask Disease Question

| Field           | Description                                                           |
| --------------- | --------------------------------------------------------------------- |
| **Actor**       | Farmer                                                                |
| **Precondition**| Farmer is on the Dashboard → Crop Disease Detection tab               |
| **Trigger**     | Farmer taps the Mic (🎙️) button                                      |
| **Main Flow**   | 1. System activates `SpeechRecognition` with locale matching selected language.<br>2. Mic button turns red with pulsing animation.<br>3. Farmer speaks query in regional language.<br>4. System transcribes speech to text in the input field.<br>5. Farmer reviews and taps Send. |
| **Alt Flow**    | Web Speech API unsupported → System simulates a sample query after 2s |
| **Postcondition** | Transcribed text appears in chat input, ready for submission         |

### UC-03: Farmer Computes Tank-Mix Dosage

| Field           | Description                                                           |
| --------------- | --------------------------------------------------------------------- |
| **Actor**       | Farmer                                                                |
| **Precondition**| Farmer navigates to Resource Management tab                           |
| **Trigger**     | Farmer enters land acreage and pump size                              |
| **Main Flow**   | 1. Farmer inputs land size (e.g., 2.5 acres).<br>2. Farmer inputs knapsack pump size (e.g., 15L).<br>3. System computes: total pumps = `ceil(2.5 × 4)` = 10.<br>4. System displays Tricyclazole dosage (18g/15L) and total water (500L).<br>5. All values pass CIBRC guardrail validation. |
| **Postcondition** | Farmer sees safe, accurate dosage calculation                       |

### UC-04: Officer Reviews 72h Weather Risk

| Field           | Description                                                           |
| --------------- | --------------------------------------------------------------------- |
| **Actor**       | Extension Officer                                                     |
| **Precondition**| Officer navigates to Weather Forecasting tab                          |
| **Main Flow**   | 1. System displays current humidity, leaf wetness duration, avg temperature.<br>2. Risk badges show pathogen vulnerability level.<br>3. Officer decides whether to recommend preventive spray to assigned farmers. |
| **Postcondition** | Officer has data to make spray-timing decisions                     |

### UC-05: Admin Listens to Advisory in Regional Language

| Field           | Description                                                           |
| --------------- | --------------------------------------------------------------------- |
| **Actor**       | Agronomist / Admin                                                    |
| **Precondition**| User navigates to Local Farmer Support tab                            |
| **Main Flow**   | 1. User selects target language from dropdown.<br>2. User taps "Listen Voice Advisory".<br>3. System synthesizes advisory text using TTS in selected language.<br>4. Audio plays through device speaker. |
| **Postcondition** | Advisory is heard in the selected regional language                 |

---

## 7. Data Requirements

### 7.1 Data Entities

| Entity              | Storage           | Key Attributes                                              |
| ------------------- | ----------------- | ----------------------------------------------------------- |
| User                | PostgreSQL        | id, username, password_hash, role, language, created_at     |
| LeafImage           | S3 / CloudFront   | id, user_id, filename, content_type, coordinates, timestamp |
| DiagnosisResult     | PostgreSQL        | id, image_id, disease_class, severity_grade, confidence, heatmap_url |
| Advisory            | PostgreSQL + Qdrant| id, diagnosis_id, text, language, cibrc_validated, products |
| WeatherSnapshot     | PostgreSQL        | id, location, humidity, leaf_wetness_hrs, temperature, risk_index, timestamp |
| CIBRCProduct        | PostgreSQL        | id, name, type, active_ingredient, dosage, approval_status, banned |
| OfflineQueueItem    | IndexedDB (client)| id, image_blob, metadata, sync_status, retry_count         |

### 7.2 Data Retention

| Data Type          | Retention Period      | Rationale                                  |
| ------------------ | --------------------- | ------------------------------------------ |
| Leaf Images        | 2 years               | Longitudinal disease tracking              |
| Diagnosis Results  | 5 years               | Research and model retraining              |
| Advisory Logs      | 3 years               | Audit trail for CIBRC compliance           |
| Weather Data       | 1 year rolling        | Seasonal pattern analysis                  |
| User Accounts      | Account lifetime + 90 days post-deletion | GDPR-equivalent compliance |

---

## Appendix A — Disease Classification Taxonomy

| Class ID | Disease Name        | Pathogen                    | Key Visual Symptom                                |
| -------- | ------------------- | --------------------------- | ------------------------------------------------- |
| C-1      | Leaf Blast          | *Magnaporthe grisea*        | Spindle-shaped lesions with grey centers           |
| C-2      | Neck Blast          | *Magnaporthe grisea*        | Black/brown lesion at panicle base                 |
| C-3      | Finger Blast        | *Magnaporthe grisea*        | Incomplete grain filling on fingers                |
| C-4      | Foot Rot            | *Sclerotium rolfsii*        | Brown-black rotting at stem base                   |
| C-5      | Brown Leaf Spot     | *Drechslera nodulosum*      | Small dark-brown oval lesions on leaves            |
| C-6      | Smut                | *Melanopsichium eleusinis*  | Green-black sori replacing grains                  |
| C-7      | Cercospora Leaf Spot| *Cercospora eleusinis*      | Circular spots with dark margins                   |
| C-8      | Healthy             | —                           | No pathological symptoms                           |

### Severity Grading Scale

| Grade | Necrotic Leaf Area | Severity Level | Recommended Action              |
| ----- | ------------------ | -------------- | ------------------------------- |
| 1     | 0–5%               | Mild           | Monitor, no immediate treatment |
| 2     | 6–20%              | Moderate       | Apply bio-fungicide             |
| 3     | 21–50%             | Severe         | Apply systemic fungicide        |
| 4     | > 50%              | Critical       | Emergency spray + field officer |

---

## Appendix B — Requirements Traceability Matrix

| Requirement ID | Feature Module         | Phase | Test Case ID | Status      |
| -------------- | ---------------------- | ----- | ------------ | ----------- |
| FR-101         | Crop Disease Detection | 2     | TC-CAM-01    | Implemented |
| FR-102         | Crop Disease Detection | 2     | TC-CAM-02    | Implemented |
| FR-103         | Crop Disease Detection | 2     | TC-CAM-03    | Implemented |
| FR-104         | Crop Disease Detection | 2     | TC-CAM-04    | Implemented |
| FR-105         | Crop Disease Detection | 2     | TC-IMG-01    | Implemented |
| FR-106         | Crop Disease Detection | 2     | TC-MIC-01    | Implemented |
| FR-107         | Crop Disease Detection | 2     | TC-MIC-02    | Implemented |
| FR-108         | Crop Disease Detection | 2     | TC-MIC-03    | Implemented |
| FR-111         | Crop Disease Detection | 3     | TC-DET-01    | Scaffolded  |
| FR-112         | Crop Disease Detection | 3     | TC-DET-02    | Scaffolded  |
| FR-113         | Explainable AI         | 4     | TC-XAI-01    | Scaffolded  |
| FR-201         | Agriculture Calendar   | 1     | TC-CAL-01    | Implemented |
| FR-301         | Resource Management    | 1     | TC-RES-01    | Implemented |
| FR-401         | Weather Forecasting    | 6     | TC-WTH-01    | Mock        |
| FR-501         | Yield Analytics        | 3     | TC-YLD-01    | Mock        |
| FR-601         | CIBRC Products         | 5     | TC-CIB-01    | Scaffolded  |
| FR-701         | Farmer Support         | 7     | TC-VOI-01    | Implemented |
| FR-801         | Auth & RBAC            | 7     | TC-AUT-01    | Stub        |
| FR-901         | Image Ingestion        | 2     | TC-ING-01    | Implemented |
| FR-1001        | PWA / Offline          | 2     | TC-PWA-01    | Partial     |

---

## Appendix C — Glossary

| Term                     | Definition                                                                       |
| ------------------------ | -------------------------------------------------------------------------------- |
| Knapsack Pump            | Portable backpack sprayer (typically 15–16L) used for pesticide application      |
| Laplacian Variance       | Image sharpness metric; higher values = sharper image                            |
| Necrotic Leaf Area Ratio | Percentage of leaf surface area showing dead (necrotic) tissue                   |
| Score-CAM                | Gradient-free visual explanation method for CNN predictions                      |
| Spore Germination Risk   | Probability of fungal spore activation based on environmental conditions         |
| Leaf Wetness Duration    | Consecutive hours leaf surfaces remain wet (dew, rain, irrigation)              |
| Background Sync API      | Browser API enabling deferred data synchronization when connectivity is restored |

---

*End of SRS Document — SRS-KS-001 v1.0*
