# Ragi-Rakshak 🌾 (GenAI Finger Millet Disease Detection & Advisory Platform)

Derived from **SRS-WEB-AGRI-004** (LTTS Smart Agriculture).

## Monorepo Architecture Overview
```text
kasthataka_sahayaka/
├── docs/
│   └── SRS-WEB-AGRI-004.md         # Full System Requirements Specification
├── backend/                        # FastAPI (Python 3.11, async)
│   ├── app/
│   │   ├── core/                   # Pydantic configuration & JWT security
│   │   ├── api/v1/endpoints/       # Ingestion, Detection, XAI, Advisory, Weather, Auth
│   │   └── main.py                 # Application entry point with CORS
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                       # Next.js 14 App Router + TailwindCSS (mobile-first)
│   ├── src/
│   │   ├── app/                    # Layout, Pages, Globals CSS
│   │   └── components/             # Reusable UI components & Health connectivity badge
│   ├── public/                     # PWA manifest & static assets
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml              # Local dev stack (Frontend, Backend, PostgreSQL/PostGIS, Qdrant)
└── README.md
```

## Quick Start (Local Development)

### Option A: Docker Compose (Recommended)
To launch the entire platform stack (Frontend, Backend, PostgreSQL + PostGIS, Qdrant Vector DB):
```bash
docker-compose up --build
```
- **Frontend PWA**: [http://localhost:3000](http://localhost:3000)
- **FastAPI OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check API**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- **Qdrant Dashboard**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard)

---

### Option B: Running Services Individually

#### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend (Next.js 14)
```bash
cd frontend
npm install
npm run dev
```

---

## SRS-WEB-AGRI-004 Phased Roadmap

- [x] **Phase 1: Architecture Skeleton & Monorepo Scaffold** (Next.js 14 + FastAPI + Docker Compose)
- [ ] **Phase 2: Camera Capture, WASM Quality Gate & Offline IndexedDB Queue**
- [ ] **Phase 3: Detection Core** (Mock-first Triton client contract, 8 disease classes, 4 severity tiers)
- [ ] **Phase 4: Explainable AI Visualizer** (Score-CAM heatmap overlay slider & rationale cards)
- [ ] **Phase 5: Generative Advisory, CIBRC Guardrail & Tank-Mix Calculator**
- [ ] **Phase 6: Multimodal Weather Fusion** (Geolocation + Ag Weather API + vulnerability index)
- [ ] **Phase 7: Persona-Specific UIs & RBAC** (Farmer voice-first, Officer batch UI, Admin GIS map)
- [ ] **Phase 8: Non-Functional Hardening** (Lighthouse ≥90, OWASP ZAP, load & cross-browser testing)