# Software Design Document (SDD)

## KisanMitra — GenAI Finger Millet Disease Detection & Advisory Platform

| Field               | Value                                                              |
| ------------------- | ------------------------------------------------------------------ |
| **Document ID**     | SDD-KS-001                                                         |
| **Version**         | 1.0                                                                |
| **Date**            | 18 August 2026                                                     |
| **Author**          | Yaswanth Jyothula                                                  |
| **Status**          | Draft                                                              |
| **Companion SRS**   | SRS-KS-001 v1.0                                                    |
| **Repository**      | https://github.com/yaswanthjyothula/KisanMitra             |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Component Design](#3-component-design)
4. [Data Design](#4-data-design)
5. [Interface Design](#5-interface-design)
6. [UI/UX Design](#6-uiux-design)
7. [Deployment Architecture](#7-deployment-architecture)
8. [Security Design](#8-security-design)
9. [Error Handling & Resilience](#9-error-handling--resilience)
10. [Technology Stack Summary](#10-technology-stack-summary)

---

## 1. Introduction

### 1.1 Purpose

This Software Design Document (SDD) describes the architectural design, component decomposition, data models, interface contracts, deployment topology, and security mechanisms for the **KisanMitra** platform. It translates the requirements defined in [SRS-KS-001](./SRS-KisanMitra.md) into a concrete technical blueprint for implementation.

### 1.2 Scope

This document covers:
- High-level system architecture (monorepo, microservices, client-server split)
- Detailed component design for both frontend and backend subsystems
- Database schema and data flow design
- API contract specifications
- UI/UX component hierarchy and interaction design
- Deployment topology (Docker Compose for development, Kubernetes for production)
- Security architecture (authentication, authorization, data protection)
- Error handling, offline resilience, and graceful degradation strategies

### 1.3 Design Methodology

The system follows these architectural principles:
- **Offline-First PWA**: Client-side caching and IndexedDB queuing as first-class concerns
- **API-First Design**: Backend contracts defined before UI implementation
- **Deterministic Safety Layer**: Rule-based CIBRC guardrail is non-negotiable and runs *after* any generative AI output
- **Progressive Enhancement**: Core functionality works on low-end devices; advanced features (3D landing, XAI heatmaps) enhance on capable hardware

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  Next.js 14 PWA (App Router + TailwindCSS)                             │ │
│  │  ┌──────────┐ ┌────────────┐ ┌───────────────┐ ┌────────────────────┐  │ │
│  │  │ Landing  │ │ Dashboard  │ │ Service Worker│ │ IndexedDB Offline  │  │ │
│  │  │ Page     │ │ (7 Tabs)   │ │ (Workbox)     │ │ Queue (pending_sync│  │ │
│  │  │ Three.js │ │ AI Chatbot │ │               │ │                    │  │ │
│  │  └──────────┘ └────────────┘ └───────────────┘ └────────────────────┘  │ │
│  │  ┌──────────────────┐ ┌─────────────────┐ ┌──────────────────────────┐ │ │
│  │  │ MediaDevices API │ │ Web Speech API  │ │ OpenCV.js WASM Quality  │ │ │
│  │  │ (getUserMedia)   │ │ (STT / TTS)     │ │ Gate (Laplacian Blur)   │ │ │
│  │  └──────────────────┘ └─────────────────┘ └──────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │ HTTPS / REST API
                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY TIER                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  FastAPI (Python 3.11+, async, Pydantic v2)                            │ │
│  │  ┌──────────┐ ┌───────────┐ ┌───────────┐ ┌──────────┐ ┌───────────┐  │ │
│  │  │ /health  │ │ /auth     │ │/ingestion │ │/detection│ │  /xai     │  │ │
│  │  └──────────┘ └───────────┘ └───────────┘ └──────────┘ └───────────┘  │ │
│  │  ┌───────────┐ ┌───────────┐ ┌──────────────────────────────────────┐  │ │
│  │  │ /advisory │ │ /weather  │ │ CIBRC Guardrail Layer (rule-based)  │  │ │
│  │  └───────────┘ └───────────┘ └──────────────────────────────────────┘  │ │
│  │                 CORS Middleware │ JWT Auth Middleware                    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────┬──────────────┬─────────────────┬────────────────┬─────────────────┘
           │              │                 │                │
           ▼              ▼                 ▼                ▼
┌────────────────┐ ┌─────────────┐ ┌────────────────┐ ┌──────────────────┐
│  PostgreSQL    │ │   Qdrant    │ │    Triton      │ │  Weather API     │
│  + PostGIS     │ │ Vector DB   │ │ Inference      │ │ Tomorrow.io /    │
│  Port: 5432    │ │ Port: 6333  │ │ Server (gRPC)  │ │ OpenWeatherMap   │
│                │ │             │ │ Swin-V2 +      │ │                  │
│ Users, Diag,   │ │ ICAR/UAS    │ │ EfficientNet   │ │ Humidity, Temp,  │
│ Advisory, GIS  │ │ Agronomy    │ │ Ensemble       │ │ Leaf Wetness     │
└────────────────┘ │ Embeddings  │ └────────────────┘ └──────────────────┘
                   └─────────────┘
```

### 2.2 Architectural Style

The system employs a **layered monorepo architecture** with clear separation:

| Layer                | Technology                    | Responsibility                                    |
| -------------------- | ----------------------------- | ------------------------------------------------- |
| Presentation Layer   | Next.js 14, React, TailwindCSS| UI rendering, client state, browser API access     |
| Client Intelligence  | OpenCV.js (WASM), Web Speech  | Image quality gate, voice I/O, offline caching     |
| API Layer            | FastAPI, Pydantic v2          | REST endpoints, validation, routing, CORS          |
| Business Logic Layer | Python modules                | Disease classification orchestration, CIBRC rules  |
| AI/ML Layer          | Triton, PyTorch/ONNX          | Model inference, Score-CAM generation              |
| Knowledge Layer      | Qdrant, RAG pipeline          | Vector search over agronomy documentation          |
| Data Layer           | PostgreSQL + PostGIS          | Persistent storage, spatial queries                |
| External Services    | Weather APIs, Bhashini        | Third-party data and speech services               |

### 2.3 Communication Patterns

```
┌─────────┐     REST/JSON      ┌─────────┐    gRPC/HTTP    ┌─────────┐
│ Frontend │ ◄──────────────► │ FastAPI  │ ◄─────────────► │ Triton  │
│ (PWA)    │                   │ Backend  │                 │ Server  │
└─────────┘                   └─────────┘                 └─────────┘
     │                             │
     │ IndexedDB                   │  SQL / Vector Query
     │ (offline queue)             │
     ▼                             ▼
┌─────────┐              ┌──────────────────┐
│ Browser  │              │ PostgreSQL │Qdrant│
│ Storage  │              └──────────────────┘
└─────────┘
```

---

## 3. Component Design

### 3.1 Frontend Components

#### 3.1.1 Component Hierarchy

```
App (RootLayout)
├── Landing Page (page.tsx → iframe → landing.html)
│   ├── Three.js WebGPU Grass Simulation (120K blades)
│   ├── Hero Section (brand title, description)
│   ├── Disease Grid (4×2 glassmorphic cards)
│   ├── Three-Step Setup Section
│   └── Centered Footer
│
└── Dashboard (dashboard/page.tsx)
    ├── TopHeader
    │   ├── Mobile Menu Toggle
    │   ├── Brand Logo & Title ("KisanMitra")
    │   ├── Landing Page Back Link
    │   └── Persona Badge
    │
    ├── Sidebar Navigation (7 menu items)
    │   ├── [01] Crop Disease Detection
    │   ├── [02] Smart Agriculture Calendar
    │   ├── [03] Resource Management
    │   ├── [04] Weather Forecasting
    │   ├── [05] Predictive Yield Analytics
    │   ├── [06] Disease Based Products
    │   └── [07] Local Farmer Support
    │
    └── Main Content Area (tab-switched)
        ├── AI Crop Advisor Chatbot (detection tab)
        │   ├── Header Banner
        │   ├── Chat Message List
        │   │   ├── BotMessage (avatar, bubble, timestamp)
        │   │   └── UserMessage (avatar, bubble, image preview, timestamp)
        │   ├── Quick Prompt Chips
        │   ├── Image Upload Preview Strip
        │   ├── Camera Viewfinder Modal
        │   │   ├── Video Feed (<video> element)
        │   │   ├── Bounding Guide Overlay
        │   │   ├── Error Fallback (system camera button)
        │   │   └── Snap Photo Button
        │   └── Input Bar
        │       ├── File Upload Button (📎)
        │       ├── Live Camera Button (📷)
        │       ├── Mic Voice Button (🎙️)
        │       ├── Text Input Field
        │       └── Send Button
        │
        ├── Calendar View (calendar tab)
        ├── Tank-Mix Calculator (resources tab)
        ├── Weather Risk Dashboard (weather tab)
        ├── Yield Analytics View (analytics tab)
        ├── CIBRC Products Grid (products tab)
        └── Multilingual Voice Support (support tab)
```

#### 3.1.2 State Management

The Dashboard uses React `useState` hooks for local component state:

| State Variable      | Type                 | Description                                       |
| ------------------- | -------------------- | ------------------------------------------------- |
| `activeTab`         | `string`             | Currently selected sidebar tab ID                 |
| `sidebarOpen`       | `boolean`            | Mobile sidebar visibility                         |
| `messages`          | `ChatMessage[]`      | Chat conversation history                         |
| `inputText`         | `string`             | Current text input value                          |
| `selectedImage`     | `string \| null`     | Base64 data URL of attached image                 |
| `isRecording`       | `boolean`            | Whether speech recognition is active              |
| `showCameraModal`   | `boolean`            | Camera viewfinder modal visibility                |
| `cameraError`       | `string \| null`     | Camera access error message                       |
| `landAcres`         | `number`             | Tank-mix calculator: farm size                    |
| `tankSizeLiters`    | `number`             | Tank-mix calculator: pump capacity                |
| `selectedLanguage`  | `string`             | Active language for voice I/O                     |

**`ChatMessage` Interface:**
```typescript
interface ChatMessage {
  id: string;          // Unique identifier (timestamp-based)
  sender: 'bot' | 'user';
  text: string;        // Message content
  time: string;        // Formatted timestamp (HH:MM)
  image?: string;      // Optional base64 image data URL
}
```

#### 3.1.3 Camera Viewfinder Component Design

```
openLiveCamera()
    │
    ├── setShowCameraModal(true)
    ├── navigator.mediaDevices.getUserMedia({
    │       video: { facingMode: 'environment', 1280×720 }
    │   })
    │
    ├── SUCCESS → stream → videoRef.srcObject = stream
    │              └── Live viewfinder with bounding guide overlay
    │                    └── "Snap Photo" → capturePhotoFromCamera()
    │                          ├── canvas.drawImage(video)
    │                          ├── canvas.toDataURL('image/jpeg', 0.85)
    │                          ├── setSelectedImage(dataUrl)
    │                          └── closeLiveCamera()
    │
    └── ERROR → setCameraError(message)
                └── Fallback: "Open System Camera Shutter"
                      └── cameraInputRef.click()
                            └── <input type="file" capture="environment">
```

#### 3.1.4 Speech Recognition Component Design

```
toggleSpeechRecognition()
    │
    ├── isRecording=true → STOP recording, return
    │
    ├── SpeechRecognition AVAILABLE
    │   ├── Create SpeechRecognition instance
    │   ├── Set language based on selectedLanguage:
    │   │     Kannada→kn-IN, Telugu→te-IN, Tamil→ta-IN,
    │   │     Hindi→hi-IN, default→en-US
    │   ├── recognition.start()
    │   ├── onresult → append transcript to inputText
    │   ├── onerror → setIsRecording(false)
    │   └── onend → setIsRecording(false)
    │
    └── SpeechRecognition UNAVAILABLE
        └── Simulate: after 2s, set sample query text
```

### 3.2 Backend Components

#### 3.2.1 Module Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app initialization, CORS, router mount
│   ├── core/
│   │   └── config.py              # Pydantic BaseSettings configuration
│   └── api/
│       └── v1/
│           ├── router.py          # Central APIRouter aggregating all endpoints
│           └── endpoints/
│               ├── health.py      # GET /api/v1/health — liveness probe
│               ├── auth.py        # POST /api/v1/auth/login — JWT stub auth
│               ├── ingestion.py   # POST /api/v1/ingestion/upload — multipart image upload
│               ├── detection.py   # GET /api/v1/detection/ — disease detection (scaffolded)
│               ├── xai.py         # GET /api/v1/xai/ — Score-CAM heatmap (scaffolded)
│               ├── advisory.py    # GET /api/v1/advisory/ — generative advisory (scaffolded)
│               └── weather.py     # GET /api/v1/weather/ — weather fusion (scaffolded)
├── Dockerfile
├── requirements.txt
├── pyproject.toml
└── .env.example
```

#### 3.2.2 Configuration Design

The `Settings` class uses Pydantic `BaseSettings` with environment variable override:

| Setting                      | Type         | Default                                                    | Description                  |
| ---------------------------- | ------------ | ---------------------------------------------------------- | ---------------------------- |
| `PROJECT_NAME`               | `str`        | `"Ragi-Rakshak API"`                                       | API title in OpenAPI docs    |
| `VERSION`                    | `str`        | `"1.0.0"`                                                  | API version                  |
| `API_V1_STR`                 | `str`        | `"/api/v1"`                                                | API prefix path              |
| `CORS_ORIGINS`               | `List[str]`  | `["http://localhost:3000", "http://127.0.0.1:3000"]`       | Allowed CORS origins         |
| `JWT_SECRET`                 | `str`        | `"super-secret-key-change-in-production-32bytes"`          | JWT signing key              |
| `JWT_ALGORITHM`              | `str`        | `"HS256"`                                                  | JWT algorithm                |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| `int`        | `1440` (24h)                                               | Token TTL                    |
| `QDRANT_URL`                 | `str`        | `"http://localhost:6333"`                                   | Qdrant connection            |
| `DATABASE_URL`               | `str`        | `"postgresql://postgres:postgres@localhost:5432/ragirakshak"` | PostgreSQL connection     |
| `WEATHER_API_KEY`            | `str`        | `"mock-key"`                                               | Weather API credential       |

#### 3.2.3 API Router Design

All endpoints are mounted under `/api/v1/` via a central `APIRouter`:

```python
api_router = APIRouter()
api_router.include_router(health.router,    tags=["Health"])
api_router.include_router(auth.router,      prefix="/auth",      tags=["Auth"])
api_router.include_router(ingestion.router, prefix="/ingestion", tags=["Ingestion"])
api_router.include_router(detection.router, prefix="/detection", tags=["Detection"])
api_router.include_router(xai.router,       prefix="/xai",       tags=["XAI"])
api_router.include_router(advisory.router,  prefix="/advisory",  tags=["Advisory"])
api_router.include_router(weather.router,   prefix="/weather",   tags=["Weather"])
```

#### 3.2.4 Endpoint Specifications

##### Health Check
```
GET /api/v1/health
Response: { status: "ok", app: string, version: string, environment: string }
```

##### Authentication (Stub)
```
POST /api/v1/auth/login
Request Body: { username: string, password: string }
Response: { access_token: string, token_type: "bearer", role: string }
Roles: "farmer" | "officer" | "agronomist_admin"
```

##### Image Ingestion
```
POST /api/v1/ingestion/upload
Content-Type: multipart/form-data
Fields:
  - file: UploadFile (required) — leaf image (JPEG/PNG/WebP)
  - latitude: float (optional) — GPS latitude
  - longitude: float (optional) — GPS longitude
  - notes: string (optional) — field observation notes
Response: { status: "received", filename: string, content_type: string, coordinates: object|null, notes: string|null }
```

##### Detection (Scaffolded — Phase 3)
```
GET /api/v1/detection/
Response: { module: "detection", status: "scaffolded" }

POST /api/v1/detection/classify (planned)
Request: multipart image
Response: { disease_class: string, severity_grade: int, confidence: float, inference_time_ms: int }
```

##### XAI Heatmap (Scaffolded — Phase 4)
```
GET /api/v1/xai/
Response: { module: "xai", status: "scaffolded" }

POST /api/v1/xai/heatmap (planned)
Request: { image_id: string }
Response: { heatmap_url: string, overlay_opacity: float, activation_regions: array }
```

##### Advisory (Scaffolded — Phase 5)
```
GET /api/v1/advisory/
Response: { module: "advisory", status: "scaffolded" }

POST /api/v1/advisory/generate (planned)
Request: { diagnosis_id: string, language: string }
Response: { advisory_text: string, products: array, cibrc_validated: boolean }
```

##### Weather (Scaffolded — Phase 6)
```
GET /api/v1/weather/
Response: { module: "weather", status: "scaffolded" }

GET /api/v1/weather/risk (planned)
Query: lat, lng
Response: { humidity_pct: float, leaf_wetness_hrs: float, avg_temp_c: float, risk_index: float, risk_level: string }
```

---

## 4. Data Design

### 4.1 Entity-Relationship Diagram

```
┌──────────────────┐         ┌──────────────────────┐
│      users       │         │     leaf_images      │
├──────────────────┤         ├──────────────────────┤
│ id (PK, UUID)    │───1:N──▶│ id (PK, UUID)        │
│ username (UQ)    │         │ user_id (FK → users)  │
│ password_hash    │         │ filename              │
│ role (ENUM)      │         │ content_type          │
│ preferred_lang   │         │ s3_key                │
│ created_at       │         │ latitude              │
│ updated_at       │         │ longitude             │
└──────────────────┘         │ blur_variance         │
                             │ captured_at           │
                             └───────┬──────────────┘
                                     │
                                     │ 1:1
                                     ▼
                            ┌──────────────────────┐
                            │  diagnosis_results   │
                            ├──────────────────────┤
                            │ id (PK, UUID)        │
                            │ image_id (FK, UQ)    │
                            │ disease_class (ENUM) │
                            │ severity_grade (1-4) │
                            │ confidence (0.0-1.0) │
                            │ heatmap_s3_key       │
                            │ model_version        │
                            │ inference_time_ms    │
                            │ created_at           │
                            └───────┬──────────────┘
                                    │
                                    │ 1:N
                                    ▼
                            ┌──────────────────────┐
                            │     advisories       │
                            ├──────────────────────┤
                            │ id (PK, UUID)        │
                            │ diagnosis_id (FK)    │
                            │ advisory_text        │
                            │ language             │
                            │ cibrc_validated      │
                            │ guardrail_rewrites   │
                            │ created_at           │
                            └──────────────────────┘

┌──────────────────────┐    ┌──────────────────────┐
│   cibrc_products     │    │  weather_snapshots   │
├──────────────────────┤    ├──────────────────────┤
│ id (PK, UUID)        │    │ id (PK, UUID)        │
│ product_name         │    │ latitude             │
│ active_ingredient    │    │ longitude            │
│ formulation_type     │    │ humidity_pct         │
│ recommended_dosage   │    │ leaf_wetness_hrs     │
│ target_diseases      │    │ avg_temp_celsius     │
│ approval_status      │    │ risk_index           │
│ banned (BOOLEAN)     │    │ risk_level           │
│ effective_date       │    │ forecast_timestamp   │
│ updated_at           │    │ created_at           │
└──────────────────────┘    └──────────────────────┘
```

### 4.2 Enumerations

```sql
-- Disease Classification
CREATE TYPE disease_class AS ENUM (
  'leaf_blast', 'neck_blast', 'finger_blast', 'foot_rot',
  'brown_leaf_spot', 'smut', 'cercospora', 'healthy'
);

-- Severity Grade
CREATE TYPE severity_grade AS ENUM ('1', '2', '3', '4');

-- User Role
CREATE TYPE user_role AS ENUM ('farmer', 'officer', 'agronomist_admin');

-- CIBRC Approval Status
CREATE TYPE cibrc_status AS ENUM ('approved', 'restricted', 'banned');
```

### 4.3 IndexedDB Schema (Client-Side Offline Queue)

```javascript
// Database: KisanMitra_db (version 1)
// Object Store: pending_sync
{
  id: IDBKeyPath (autoIncrement),
  image_blob: Blob,                // Captured/uploaded image binary
  metadata: {
    latitude: number | null,
    longitude: number | null,
    notes: string,
    captured_at: ISO8601 string
  },
  sync_status: 'pending' | 'syncing' | 'failed',
  retry_count: number,             // Max 5 retries with exponential backoff
  created_at: ISO8601 string
}
```

### 4.4 Vector Store Schema (Qdrant)

```json
{
  "collection_name": "agronomy_knowledge",
  "vector_size": 768,
  "distance": "Cosine",
  "payload_schema": {
    "source_document": "string",
    "section_title": "string",
    "content_text": "string",
    "disease_tags": ["string"],
    "language": "string",
    "source_org": "ICAR | UAS | CIBRC"
  }
}
```

---

## 5. Interface Design

### 5.1 API Flow — Disease Detection Pipeline

```
┌──────┐         ┌────────┐        ┌──────────┐       ┌────────┐       ┌──────────┐
│Client│         │OpenCV  │        │  FastAPI  │       │ Triton │       │  Qdrant  │
│ PWA  │         │WASM    │        │  Backend  │       │ Server │       │ VectorDB │
└──┬───┘         └───┬────┘        └────┬─────┘       └───┬────┘       └────┬─────┘
   │                  │                 │                  │                 │
   │  1. Capture      │                 │                  │                 │
   │  Image           │                 │                  │                 │
   │─────────────────▶│                 │                  │                 │
   │                  │                 │                  │                 │
   │  2. Laplacian    │                 │                  │                 │
   │  Blur Check      │                 │                  │                 │
   │◀─────────────────│                 │                  │                 │
   │  variance > 100? │                 │                  │                 │
   │                  │                 │                  │                 │
   │  3. Upload Image ──────────────────▶                  │                 │
   │  POST /ingestion/upload            │                  │                 │
   │                                    │                  │                 │
   │                   4. Forward to ───▶                  │                 │
   │                   Triton gRPC      │                  │                 │
   │                                    │◀── 5. Return ───│                 │
   │                                    │  class + score   │                 │
   │                                    │                  │                 │
   │                   6. Query RAG ────────────────────────────────────────▶│
   │                   for advisory     │                  │                 │
   │                                    │◀──────── 7. Return relevant ──────│
   │                                    │          agronomy passages        │
   │                                    │                  │                 │
   │                   8. Generate      │                  │                 │
   │                   LLM Advisory     │                  │                 │
   │                   + CIBRC Guard    │                  │                 │
   │                                    │                  │                 │
   │◀──────── 9. Return result ─────────│                  │                 │
   │  { disease, grade, advisory,       │                  │                 │
   │    heatmap_url, products }         │                  │                 │
   │                  │                 │                  │                 │
```

### 5.2 Offline Sync Flow

```
┌──────────┐      ┌───────────┐      ┌──────────────┐      ┌─────────┐
│  Camera  │      │ IndexedDB │      │ Background   │      │ FastAPI │
│ Capture  │      │ Queue     │      │ Sync API     │      │ Backend │
└────┬─────┘      └─────┬─────┘      └──────┬───────┘      └────┬────┘
     │                   │                    │                   │
     │ 1. Image captured │                    │                   │
     │──────────────────▶│                    │                   │
     │                   │                    │                   │
     │   2. Network      │                    │                   │
     │   offline?        │                    │                   │
     │   ┌──YES──────────┤                    │                   │
     │   │  Store in     │                    │                   │
     │   │  pending_sync │                    │                   │
     │   └───────────────┤                    │                   │
     │                   │                    │                   │
     │              3. Connectivity restored  │                   │
     │                   │───────────────────▶│                   │
     │                   │  sync event fires  │                   │
     │                   │                    │                   │
     │                   │              4. Flush queue            │
     │                   │                    │──────────────────▶│
     │                   │                    │  POST /upload     │
     │                   │                    │                   │
     │                   │                    │◀── 5. 200 OK ─────│
     │                   │                    │                   │
     │                   │◀── 6. Remove ──────│                   │
     │                   │    from queue      │                   │
     │                   │                    │                   │
```

---

## 6. UI/UX Design

### 6.1 Design System

#### Color Palette

| Token                | Value       | Usage                                     |
| -------------------- | ----------- | ----------------------------------------- |
| `emerald-600`        | `#059669`   | Primary action buttons, active states     |
| `emerald-700`        | `#047857`   | Header gradients, hover states            |
| `emerald-800`        | `#065F46`   | Dark gradient endpoints                   |
| `emerald-950`        | `#022C22`   | Brand text, headings                      |
| `emerald-50`         | `#ECFDF5`   | Sidebar background, subtle highlights     |
| `emerald-100`        | `#D1FAE5`   | Borders, badges, card backgrounds         |
| `slate-50`           | `#F8FAFC`   | Main content area background              |
| `slate-900`          | `#0F172A`   | Primary body text                         |
| `white`              | `#FFFFFF`   | Dashboard base background, cards          |
| `red-500`            | `#EF4444`   | Recording indicator, error states         |
| `amber-600`          | `#D97706`   | Warning badges, yield loss indicators     |
| `sky-600`            | `#0284C7`   | Humidity metric accent                    |

#### Typography

| Element          | Font Family             | Weight     | Size                          |
| ---------------- | ----------------------- | ---------- | ----------------------------- |
| Landing Heading  | Playfair Display, serif | 400        | clamp(48px, 8vw, 110px)       |
| Dashboard H1     | System sans-serif       | 800 (bold) | 18px (1.125rem)               |
| Section Heading  | System sans-serif       | 800 (bold) | 24px (1.5rem)                 |
| Body Text        | Inter, system-ui        | 400        | 12px (0.75rem)                |
| Mono Labels      | System monospace        | 700 (bold) | 10–11px                       |

#### Spacing & Layout

| Property                | Value                                |
| ----------------------- | ------------------------------------ |
| Dashboard min-height    | 100vh (full viewport)                |
| Sidebar width           | 288px (18rem / `w-72`)               |
| Content padding         | 16px mobile → 32px desktop           |
| Card border-radius      | 16px (`rounded-2xl`)                 |
| Touch target minimum    | 48×48px (12×12 with p-3)            |
| Mobile breakpoint       | 768px (`md:`)                        |

### 6.2 Page Layouts

#### Landing Page Layout
```
┌──────────────────────────────────────┐
│ [Three.js Canvas - fixed bg]         │
│ ┌──────────────────────────────────┐ │
│ │ Header: Brand + [Dashboard →]   │ │
│ ├──────────────────────────────────┤ │
│ │                                  │ │
│ │ Hero: "KisanMitra"      │ │
│ │ Subtitle text                    │ │
│ │                                  │ │
│ ├──────────────────────────────────┤ │
│ │ Disease Grid (4 columns × 2 rows)│ │
│ │ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │ │
│ │ │    │ │    │ │    │ │    │    │ │
│ │ └────┘ └────┘ └────┘ └────┘    │ │
│ │ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │ │
│ │ │    │ │    │ │    │ │    │    │ │
│ │ └────┘ └────┘ └────┘ └────┘    │ │
│ ├──────────────────────────────────┤ │
│ │ Three-Step Setup                 │ │
│ │ ┌──────┐ ┌──────┐ ┌──────┐     │ │
│ │ │Step 1│ │Step 2│ │Step 3│     │ │
│ │ └──────┘ └──────┘ └──────┘     │ │
│ ├──────────────────────────────────┤ │
│ │ Footer (centered brand block)    │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

#### Dashboard Layout
```
┌──────────────────────────────────────────────────────┐
│ Header: [☰] 🌾 KisanMitra    [← Landing]   │
├──────────┬───────────────────────────────────────────┤
│          │                                           │
│ Sidebar  │  Main Content Area (active tab)           │
│ ┌──────┐ │  ┌─────────────────────────────────────┐  │
│ │ 01 📷│ │  │ ┌───────────────────────────────┐   │  │
│ │ 02 📅│ │  │ │  Gradient Header Banner       │   │  │
│ │ 03 🚜│ │  │ └───────────────────────────────┘   │  │
│ │ 04 🌤│ │  │                                     │  │
│ │ 05 📊│ │  │ ┌───────────────────────────────┐   │  │
│ │ 06 🧪│ │  │ │  Tab-specific content         │   │  │
│ │ 07 🗣│ │  │ │  (chat, calculator, cards...) │   │  │
│ └──────┘ │  │ └───────────────────────────────┘   │  │
│          │  │                                     │  │
│          │  │ ┌───────────────────────────────┐   │  │
│          │  │ │  Input / Action area          │   │  │
│          │  │ └───────────────────────────────┘   │  │
│          │  └─────────────────────────────────────┘  │
└──────────┴───────────────────────────────────────────┘
```

### 6.3 Responsive Breakpoints

| Breakpoint | Width   | Layout Changes                                          |
| ---------- | ------- | ------------------------------------------------------- |
| Mobile     | < 768px | Sidebar hidden (hamburger toggle), single column        |
| Tablet     | ≥ 768px | Sidebar visible, 2-column content grids                 |
| Desktop    | ≥ 1024px| Full sidebar + expanded content, 3-column grids         |

---

## 7. Deployment Architecture

### 7.1 Development Environment (Docker Compose)

```yaml
# docker-compose.yml
services:
  frontend:    # Next.js 14 → port 3000
  backend:     # FastAPI → port 8000
  postgres:    # PostGIS 15 → port 5432
  qdrant:      # Vector DB → ports 6333, 6334

volumes:
  postgres_data:   # Persistent PostgreSQL storage
  qdrant_data:     # Persistent vector storage
```

**Service Dependencies:**
```
frontend → backend → postgres, qdrant
```

### 7.2 Production Environment (Kubernetes)

```
┌─────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                     │
│                                                          │
│  ┌─────────────────┐   ┌─────────────────────────────┐  │
│  │  Ingress (TLS)  │   │  ConfigMap / Secrets        │  │
│  │  TLS 1.3 edge   │   │  JWT_SECRET, DB creds,      │  │
│  │  termination    │   │  API keys                    │  │
│  └────────┬────────┘   └─────────────────────────────┘  │
│           │                                              │
│  ┌────────▼────────┐   ┌──────────────────────────────┐ │
│  │  Frontend Pod   │   │  Backend Pod (HPA: 2-20)    │ │
│  │  Next.js 14     │   │  FastAPI + Uvicorn           │ │
│  │  (2 replicas)   │   │  + Gunicorn workers          │ │
│  └─────────────────┘   └──────────┬───────────────────┘ │
│                                    │                     │
│  ┌──────────────────┐  ┌──────────▼───────────────────┐ │
│  │  Triton Pod      │  │  StatefulSets                │ │
│  │  (GPU nodes)     │  │  ┌──────────┐ ┌───────────┐  │ │
│  │  Swin-V2 +       │  │  │PostgreSQL│ │  Qdrant   │  │ │
│  │  EfficientNet    │  │  │+ PostGIS │ │           │  │ │
│  └──────────────────┘  │  └──────────┘ └───────────┘  │ │
│                        └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 7.3 Container Specifications

| Container  | Base Image                 | Port  | Resource Limits (Prod)            |
| ---------- | -------------------------- | ----- | --------------------------------- |
| Frontend   | `node:20-alpine`           | 3000  | CPU: 500m, Memory: 512Mi         |
| Backend    | `python:3.11-slim`         | 8000  | CPU: 1000m, Memory: 1Gi          |
| PostgreSQL | `postgis/postgis:15-3.3`   | 5432  | CPU: 500m, Memory: 1Gi, PVC: 20Gi|
| Qdrant     | `qdrant/qdrant:latest`     | 6333  | CPU: 500m, Memory: 2Gi, PVC: 10Gi|
| Triton     | `nvcr.io/nvidia/tritonserver` | 8001 | GPU: 1, Memory: 4Gi             |

---

## 8. Security Design

### 8.1 Authentication Flow

```
┌────────┐                    ┌─────────┐                    ┌──────────┐
│ Client │                    │ FastAPI │                    │PostgreSQL│
└───┬────┘                    └────┬────┘                    └────┬─────┘
    │                              │                              │
    │ 1. POST /auth/login          │                              │
    │ { username, password }       │                              │
    │─────────────────────────────▶│                              │
    │                              │ 2. Verify credentials        │
    │                              │─────────────────────────────▶│
    │                              │◀─────────────────────────────│
    │                              │                              │
    │                              │ 3. Generate JWT              │
    │                              │ (HS256, 24h expiry)          │
    │                              │                              │
    │◀─────────────────────────────│                              │
    │ { access_token, role }       │                              │
    │                              │                              │
    │ 4. Subsequent requests       │                              │
    │ Authorization: Bearer <jwt>  │                              │
    │─────────────────────────────▶│                              │
    │                              │ 5. Validate JWT + RBAC       │
    │                              │                              │
```

### 8.2 CIBRC Safety Guardrail Design

```
┌───────────────────────────────────────────────────────┐
│               CIBRC Guardrail Pipeline                 │
│                                                       │
│  1. LLM generates advisory text                       │
│     ↓                                                 │
│  2. Parse all chemical mentions (NER / regex)         │
│     ↓                                                 │
│  3. For EACH chemical:                                │
│     ├── Lookup in cibrc_products table                │
│     ├── CHECK: banned == true?                        │
│     │   ├── YES → REWRITE with approved alternative   │
│     │   │         Log guardrail_rewrite event          │
│     │   └── NO  → CHECK: dosage in safe range?        │
│     │             ├── YES → PASS through               │
│     │             └── NO  → CLAMP to max safe dosage   │
│     │                       Add safety warning          │
│     ↓                                                 │
│  4. SET cibrc_validated = true                        │
│  5. Return sanitized advisory                         │
│                                                       │
│  ⚠️ INVARIANT: No advisory reaches user without       │
│     cibrc_validated == true                           │
└───────────────────────────────────────────────────────┘
```

### 8.3 Security Measures Summary

| Measure                        | Implementation                                           |
| ------------------------------ | -------------------------------------------------------- |
| Authentication                 | OAuth2 + JWT (HS256, 24h TTL)                            |
| Authorization                  | Role-based (farmer, officer, agronomist_admin)           |
| Transport Security             | TLS 1.3 edge termination at Ingress                      |
| CORS Protection                | Allowlist-based origins in FastAPI middleware             |
| Input Validation               | Pydantic v2 models on all endpoints                      |
| File Upload Safety             | MIME type validation + max size (10MB)                   |
| Secret Management              | Environment variables, never hardcoded in source         |
| SQL Injection Prevention       | Parameterized queries via SQLAlchemy ORM                 |
| XSS Prevention                 | React auto-escaping + Content Security Policy headers    |
| Dependency Scanning            | Automated via `pip-audit` and `npm audit`                |

---

## 9. Error Handling & Resilience

### 9.1 Error Categories

| Category              | HTTP Code | Client Handling                                        |
| --------------------- | --------- | ------------------------------------------------------ |
| Validation Error      | 422       | Display field-specific error messages                  |
| Authentication Error  | 401       | Redirect to login, clear stored token                  |
| Authorization Error   | 403       | Display "insufficient permissions" toast               |
| Not Found             | 404       | Display "resource not found" with retry option         |
| Server Error          | 500       | Display generic error, log for investigation           |
| Network Offline       | —         | Queue in IndexedDB, show offline banner                |
| Camera Denied         | —         | Show fallback button for native camera input           |
| Speech API Missing    | —         | Simulate with sample query text                        |

### 9.2 Offline Resilience Strategy

```
┌─────────────────────────────────────────┐
│          Connectivity States            │
│                                         │
│  ONLINE ──────▶ Normal operation        │
│     │                                   │
│     ▼                                   │
│  OFFLINE ─────▶ Queue to IndexedDB      │
│     │           Show offline banner      │
│     │           Serve cached assets      │
│     │                                   │
│     ▼                                   │
│  RECONNECTED ─▶ Background Sync fires   │
│                 Flush pending_sync       │
│                 Retry up to 5×           │
│                 Exponential backoff      │
│                 (1s, 2s, 4s, 8s, 16s)   │
└─────────────────────────────────────────┘
```

### 9.3 Camera Error Fallback Chain

```
getUserMedia({facingMode:'environment'})
    │
    ├── SUCCESS → Live viewfinder modal
    │
    └── FAIL (Permission denied / Not supported)
         │
         ├── Show error message in modal
         │
         └── Offer fallback button:
              "Open System Camera Shutter"
                  │
                  └── <input type="file" capture="environment">
                       │
                       └── System camera app opens
                            └── Photo returned to app
```

---

## 10. Technology Stack Summary

### 10.1 Frontend Stack

| Technology          | Version   | Purpose                                              |
| ------------------- | --------- | ---------------------------------------------------- |
| Next.js             | 14.x      | React framework with App Router and SSR              |
| React               | 18.x      | UI component library                                 |
| TypeScript          | 5.x       | Type-safe JavaScript                                 |
| TailwindCSS         | 3.4.x     | Utility-first CSS framework                          |
| Lucide React        | 0.344.x   | Icon library (Camera, Mic, Send, etc.)               |
| Three.js            | Latest    | 3D WebGPU grass simulation (landing page)            |
| OpenCV.js           | 4.x       | WASM image quality gate (Laplacian blur)             |
| Web Speech API      | Native    | Browser STT/TTS                                      |
| MediaDevices API    | Native    | Live camera access (`getUserMedia`)                  |

### 10.2 Backend Stack

| Technology          | Version   | Purpose                                              |
| ------------------- | --------- | ---------------------------------------------------- |
| FastAPI             | ≥ 0.110   | Async REST API framework                              |
| Uvicorn             | ≥ 0.28    | ASGI server                                           |
| Pydantic            | ≥ 2.6     | Data validation and settings management              |
| pydantic-settings   | ≥ 2.2     | Environment-based configuration                      |
| python-jose         | ≥ 3.3     | JWT token creation and verification                  |
| passlib             | ≥ 1.7.4   | Password hashing (bcrypt)                            |
| python-multipart    | ≥ 0.0.9   | Multipart file upload handling                       |
| httpx               | ≥ 0.27    | Async HTTP client for external APIs                  |

### 10.3 Infrastructure Stack

| Technology          | Version         | Purpose                                        |
| ------------------- | --------------- | ---------------------------------------------- |
| Docker              | 24.x            | Containerization                               |
| Docker Compose      | 3.8             | Local development orchestration                |
| PostgreSQL          | 15              | Relational database                            |
| PostGIS             | 3.3             | Spatial data extension                         |
| Qdrant              | Latest          | Vector similarity search                       |
| Triton Server       | 2.x             | ML model inference (production)                |
| Kubernetes          | 1.28+           | Production container orchestration             |

### 10.4 Development & Quality Tools

| Tool                | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| ESLint              | JavaScript/TypeScript linting                        |
| Prettier            | Code formatting                                      |
| Ruff                | Python linting (fast)                                |
| Black               | Python code formatting                               |
| pytest              | Python unit testing                                  |
| pytest-asyncio      | Async test support                                   |
| Lighthouse          | Performance and PWA audit                            |
| OWASP ZAP           | Security vulnerability scanning                      |

---

## Appendix A — File Inventory & Responsibilities

| File Path                                          | Responsibility                                    |
| -------------------------------------------------- | ------------------------------------------------- |
| `frontend/src/app/page.tsx`                         | Landing page (iframe to `landing.html`)           |
| `frontend/src/app/layout.tsx`                       | Root HTML layout, metadata, viewport config       |
| `frontend/src/app/globals.css`                      | Global TailwindCSS directives                     |
| `frontend/src/app/dashboard/page.tsx`               | Full dashboard: 7 tabs, chatbot, camera, mic      |
| `frontend/src/components/HealthBadge.tsx`            | Backend connectivity status badge component       |
| `frontend/public/landing.html`                      | Three.js WebGPU grass simulation landing page     |
| `frontend/public/manifest.json`                     | PWA manifest (name, icons, display, orientation)  |
| `frontend/next.config.mjs`                          | Next.js configuration                             |
| `frontend/tailwind.config.ts`                       | TailwindCSS theme customization                   |
| `backend/app/main.py`                               | FastAPI app entry point, CORS, router mount       |
| `backend/app/core/config.py`                        | Pydantic BaseSettings (env-driven config)         |
| `backend/app/api/v1/router.py`                      | Central router aggregating all endpoint modules   |
| `backend/app/api/v1/endpoints/health.py`             | Health check liveness probe                       |
| `backend/app/api/v1/endpoints/auth.py`               | JWT authentication (stub)                         |
| `backend/app/api/v1/endpoints/ingestion.py`          | Multipart image upload with GPS metadata          |
| `backend/app/api/v1/endpoints/detection.py`          | Disease classification (scaffolded)               |
| `backend/app/api/v1/endpoints/xai.py`                | Score-CAM heatmap generation (scaffolded)         |
| `backend/app/api/v1/endpoints/advisory.py`           | Generative advisory + CIBRC guard (scaffolded)    |
| `backend/app/api/v1/endpoints/weather.py`            | Weather risk index (scaffolded)                   |
| `docker-compose.yml`                                | 4-service dev stack orchestration                 |

---

## Appendix B — Phased Implementation Mapping

| Phase | Milestone                                     | SRS Requirements                   | Status       |
| ----- | --------------------------------------------- | ---------------------------------- | ------------ |
| 1     | Architecture Skeleton & Monorepo Scaffold     | FR-801, FR-901                     | ✅ Complete   |
| 2     | Camera Capture, WASM Quality Gate, Offline    | FR-101–FR-110, FR-903–FR-904, FR-1001–FR-1004 | 🔶 In Progress |
| 3     | Detection Core (Triton contract, 8 classes)   | FR-111, FR-112, FR-501–FR-503     | ⬜ Scaffolded |
| 4     | Explainable AI Visualizer (Score-CAM)         | FR-113                             | ⬜ Scaffolded |
| 5     | Generative Advisory, CIBRC Guard, Tank-Mix    | FR-301–FR-306, FR-601–FR-605      | 🔶 Partial    |
| 6     | Multimodal Weather Fusion                     | FR-401–FR-406                      | ⬜ Scaffolded |
| 7     | Persona-Specific UIs & RBAC                   | FR-701–FR-704, FR-801–FR-804      | 🔶 Partial    |
| 8     | Non-Functional Hardening                      | NFR-01–NFR-25                      | ⬜ Planned    |

---

*End of SDD Document — SDD-KS-001 v1.0*
