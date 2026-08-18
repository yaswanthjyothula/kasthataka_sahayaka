# SRS-WEB-AGRI-004: GenAI Finger Millet (Ragi) Disease Detection & Advisory Platform

## System Overview
"Ragi-Rakshak" is a cloud-native Progressive Web Application (PWA) for finger millet (Eleusine coracana / ragi) disease detection, explainable visual diagnostic feedback, generative agronomical advisory, deterministic safety guardrails, weather-based risk forecasting, and regional outbreak tracking.

## Tech Stack Specification
- **Frontend**: Next.js 14+ (App Router), TypeScript, React, TailwindCSS (mobile-first, 360px–1920px).
- **Client Vision**: OpenCV.js (WASM) for client-side image blur quality gate (Laplacian variance threshold > 100).
- **Backend**: FastAPI (Python 3.11+, async), Pydantic v2, OAuth2/JWT auth, multipart streaming.
- **Vision Inference**: PyTorch/ONNX models served via Triton Inference Server (Swin-V2 + EfficientNet ensemble), Score-CAM heatmap overlay generation.
- **RAG / GenAI**: Qdrant vector database + LLM grounded on ICAR/UAS agronomy documentation with a deterministic CIBRC pesticide-safety guardrail layer (rule-based validator running post-LLM generation).
- **Weather Fusion**: Tomorrow.io Ag Weather API or OpenWeatherMap OneCall.
- **Speech**: Web Speech API client-side with cloud fallback (Bhashini/Azure Speech) supporting 7 languages (Kannada, Telugu, Tamil, Marathi, Odia, Hindi, English).
- **Maps / GIS**: Mapbox GL JS for regional disease outbreak visualization.
- **Database / Storage**: Supabase (Postgres + PostGIS extension) for spatial records/user data; S3 / CloudFront for leaf images.
- **PWA Capabilities**: manifest.json, Service Worker (Workbox), IndexedDB offline queue, Background Sync API.
- **Deployment**: Kubernetes with horizontal autoscaling, TLS 1.3 edge termination.

## Core Non-Negotiable Requirements
1. **Deterministic CIBRC Safety Guardrail**: Rule-based lookup table engine that validates all LLM chemical recommendations *before* surfacing to farmers. Must rewrite/block banned chemicals or out-of-range dosages.
2. **Offline-First Graceful Degradation**: 2G/3G connectivity loss must queue captures in IndexedDB (`pending_sync`) and auto-flush via Background Sync API once reconnected.
3. **Multi-Persona UX Isolation**:
   - **Farmer**: 1-tap capture, voice-first, large touch targets, high-contrast vernacular interface.
   - **Extension Officer**: Batch photo ingestion, offline queue manager across multiple field visits, manual diagnostic overrides.
   - **Agronomist / Admin**: Regional GIS outbreak mapping, spatial queries, RAG document curation, RBAC, CSV exports.
4. **Disease Coverage**:
   - Leaf Blast
   - Neck Blast
   - Finger Blast
   - Foot Rot
   - Brown Leaf Spot
   - Smut
   - Cercospora
   - Healthy
5. **Necrotic Severity Grading**: 4-tier ratio classification:
   - Grade 1: 0–5% necrotic leaf area
   - Grade 2: 6–20% necrotic leaf area
   - Grade 3: 21–50% necrotic leaf area
   - Grade 4: >50% necrotic leaf area

## Phased Build Milestones
- Phase 1: Repo Scaffold & Architecture Skeleton
- Phase 2: Camera Capture, WASM Quality Gate, Offline Queue
- Phase 3: Detection Core (Mock & Triton contract)
- Phase 4: Explainable AI Visualizer (Score-CAM heatmap overlay canvas slider & rationale card)
- Phase 5: Generative Advisory, CIBRC Guardrail, Tank-Mix Calculator, Voice Agent
- Phase 6: Multimodal Weather Fusion & Vulnerability Index
- Phase 7: Persona-Specific UIs & RBAC
- Phase 8: Non-Functional Hardening (Lighthouse ≥90, OWASP ZAP, load & cross-browser testing)
