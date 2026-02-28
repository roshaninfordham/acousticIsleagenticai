<p align="center">
  <h1 align="center">🎵 AcousticIsle</h1>
  <p align="center"><strong>Empowering Indigenous Musical Heritage Through AI</strong></p>
  <p align="center">
    <em>Move, speak, clap, or wave — our AI watches, listens, and pays royalties to indigenous communities in real-time.</em>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Gemini_3_NYC_Hackathon-2025-blueviolet?style=for-the-badge" alt="Hackathon"/>
    <img src="https://img.shields.io/badge/Gemini_2.0_Flash-Multimodal_AI-yellow?style=for-the-badge" alt="Gemini"/>
    <img src="https://img.shields.io/badge/Temporal_Cloud-Durable_Workflows-00B4AB?style=for-the-badge" alt="Temporal"/>
    <img src="https://img.shields.io/badge/LlamaIndex-Semantic_RAG-06B6D4?style=for-the-badge" alt="LlamaIndex"/>
  </p>
</p>

---

## 🌍 The Problem

Indigenous communities around the world are losing billions in unreported music royalties every year.

| Issue | Impact |
|-------|--------|
| **$2.5B+** yearly in unreported indigenous music royalties | Communities lose their primary cultural income |
| Cultural heritage exploited without attribution | Erosion of musical traditions |
| No real-time connection between creators and communities | Zero transparency in royalty distribution |
| Traditional music archives are siloed and inaccessible | Cultural knowledge locked away |

**Indigenous music is sampled, remixed, and streamed millions of times — but the communities that created it rarely see a cent.**

---

## 💡 Our Solution

**AcousticIsle** is an AI-native platform that bridges the gap between live human interaction and protected indigenous music archives.

> **Every movement writes a royalty. Every sound preserves a culture.**

When a user interacts with AcousticIsle — moving, speaking, clapping, tapping, or making any sound — our multi-agent AI swarm:

1. **Watches and listens** through your camera and microphone
2. **Understands your energy** — movement speed, rhythm, intensity
3. **Retrieves the perfect matching heritage stem** from a curated indigenous music catalog
4. **Pays a micro-royalty** to the originating indigenous community — instantly, transparently, immutably

```
You move → AI analyzes → Heritage music matches → Royalty paid → Community empowered
```

---

## 🤖 How It Works — Multi-Agent Pipeline

AcousticIsle uses a **5-agent orchestration pipeline**, each powered by a different technology:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  TELEMETRY  │───▶│  RHYTHMIC   │───▶│  ETHNOMUSIC  │───▶│  HERITAGE   │───▶│   DURABLE   │
│  SPECIALIST │    │  ANALYST    │    │  OLOGIST DJ  │    │   ENGINE    │    │   LEDGER    │
│             │    │             │    │              │    │             │    │             │
│  ⚡ WebRTC  │    │ ⚡ Gemini   │    │ ⚡ Genkit    │    │ ⚡ LlamaIndex│    │ ⚡ Temporal  │
│  + Canvas   │    │  2.0 Flash  │    │  + Gemini    │    │ + Embeddings│    │   Cloud     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Agent Details

| Agent | Role | Powered By | What It Does |
|-------|------|-----------|--------------|
| **Telemetry Specialist** | Sensing | WebRTC + Canvas | Captures camera frames, detects motion via frame differencing, measures kinetic energy |
| **Rhythmic Analyst** | Analysis | Gemini 2.0 Flash | Analyzes movement patterns, estimates BPM, classifies energy level (1-10) |
| **Ethnomusicologist DJ** | Orchestration | Genkit + Gemini | Uses multimodal AI to determine the culturally appropriate music response |
| **Heritage Engine** | Retrieval | LlamaIndex + Gemini Embeddings | Semantically searches the indigenous music catalog for the best matching stem |
| **Durable Ledger** | Recording | Temporal Cloud | Writes immutable micro-royalties with exactly-once guarantees and retry policies |

---

## 🎯 Market Opportunity

| Metric | Value |
|--------|-------|
| Global music industry | $28.6B (2024) |
| Unreported indigenous royalties | $2.5B+ annually |
| Indigenous music sampling rate | Growing 340% YoY on platforms |
| Addressable market | 370M+ indigenous people worldwide |

---

## 🛠️ Technology Stack

| Technology | Purpose | Why We Chose It |
|-----------|---------|----------------|
| **Gemini 2.0 Flash** | Multimodal AI analysis | Fastest multimodal model, processes camera frames in real-time |
| **LlamaIndex** | Semantic RAG retrieval | Vector-based heritage search with Gemini embeddings |
| **Temporal Cloud** | Durable workflow orchestration | Guaranteed execution, automatic retries, workflow observability |
| **Genkit** | AI flow orchestration | Google's framework for structured AI pipelines with tool use |
| **YouTube Data API v3** | Music discovery | Real indigenous music content from YouTube |
| **Next.js 15** | Full-stack React framework | Server-side rendering, API routes, Turbopack |
| **WebRTC** | Real-time media capture | Browser-native camera/mic access |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      BROWSER (Client)                     │
│                                                           │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────────┐   │
│  │ Camera   │  │ JamSession    │  │ RoyaltyLedger    │   │
│  │ + Mic    │──│ (frame capture│──│ (polls /api/     │   │
│  │ (WebRTC) │  │  + motion     │  │  ledger every 3s)│   │
│  └──────────┘  │  detection)   │  └──────────────────┘   │
│                └───────┬───────┘                          │
│                        │ POST /api/orchestrate            │
└────────────────────────┼─────────────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────────────┐
│                   NEXT.JS API ROUTES                      │
│                        │                                  │
│  ┌─────────────────────▼───────────────────────────────┐  │
│  │             /api/orchestrate                        │  │
│  │                                                     │  │
│  │  1. Try Temporal Cloud (15s timeout)                │  │
│  │     └─ Start processFrameWorkflow ──────────────┐   │  │
│  │  2. Fallback: Direct Gemini execution           │   │  │
│  │  3. Enrich with YouTube heritage video          │   │  │
│  │  4. Log royalty to local ledger                 │   │  │
│  └─────────────────────────────────────────────────┘   │  │
│                                                         │  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │ /api/ledger  │  │ /api/stats   │  │ /api/youtube │  │  │
│  │ GET ledger   │  │ GET metrics  │  │ GET heritage │  │  │
│  │ data         │  │ for landing  │  │ videos       │  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │  │
└──────────────────────────────────────┬──────────────────┘  │
                                       │                     │
┌──────────────────────────────────────▼─────────────────────┘
│                    TEMPORAL CLOUD                          │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  processFrameWorkflow                               │  │
│  │                                                     │  │
│  │  Activity 1: analyzeAndRetrieveStemActivity         │  │
│  │    └─ Gemini 2.0 Flash (multimodal analysis)        │  │
│  │    └─ LlamaIndex (semantic heritage retrieval)      │  │
│  │                                                     │  │
│  │  Activity 2: logRoyaltyActivity                     │  │
│  │    └─ Local Ledger (JSON persistence)               │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  Worker polls task queue: 'acoustic-isle'                  │
│  Retry policy: 3 attempts, exponential backoff             │
└───────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** 9+
- A **camera and microphone** (for the live sandbox)

### 1. Clone the repo

```bash
git clone https://github.com/roshaninfordham/acousticIsleagenticai.git
cd acousticIsleagenticai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your API keys:

```env
GOOGLE_GENAI_API_KEY=your-gemini-api-key
YOUTUBE_API_KEY=your-youtube-api-key
TEMPORAL_API_KEY=your-temporal-api-key
TEMPORAL_NAMESPACE=your-namespace.account-id
TEMPORAL_ADDRESS=your-namespace.account-id.tmprl.cloud:7233
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser.

### 5. (Optional) Start the Temporal Worker

In a second terminal:

```bash
npm run temporal:worker
```

This connects to Temporal Cloud for durable workflow execution. Without the worker, the app falls back to direct Gemini execution — still fully functional.

---

## 🎮 How to Use

1. **Open the app** at `http://localhost:9002`
2. **Read the landing page** — understand the problem and solution
3. **Click "Launch Live Sandbox"**
4. **Click "Launch Swarm"** — allow camera/mic access
5. **Do anything on screen:**
   - 🖐️ Wave your hands
   - 💃 Dance or sway
   - 👏 Clap rhythmically
   - 🗣️ Speak or sing
   - 🎵 Tap objects for percussion
   - 🌈 Show colors or objects
6. **Watch the AI respond:**
   - The orchestration graph lights up as agents process
   - BPM and energy score update live
   - A heritage stem is matched from the catalog
   - A YouTube reference appears for real music
   - A micro-royalty is logged to the community vault

---

## 📊 Key Features

| Feature | Description |
|---------|-------------|
| **Real-time AI Analysis** | Camera frames analyzed by Gemini 2.0 Flash every 5 seconds |
| **Semantic Heritage Matching** | LlamaIndex retrieves culturally appropriate stems using vector embeddings |
| **Durable Execution** | Temporal Cloud ensures every royalty is logged with exactly-once guarantees |
| **YouTube Integration** | Real indigenous music discovered via YouTube Data API |
| **Live Metrics** | Royalties, communities, and workflows tracked in real-time |
| **Generative Audio** | WebAudio API synthesizes responsive audio based on detected energy |
| **Motion Detection** | Frame differencing algorithm measures kinetic energy |
| **Fallback Resilience** | App always works — even without Temporal or when Gemini rate-limited |

---

## 🧪 Challenges We Faced

| Challenge | How We Solved It |
|-----------|-----------------|
| **Temporal worker imports** | `'use server'` directive blocked non-Next.js execution — removed it and used relative imports with `tsconfig-paths` |
| **Gemini rate limits** | Implemented fallback outputs so the demo never breaks, even under rate limiting |
| **Large media payloads** | Switched from 3-second WebM blobs to single JPEG frames (95% smaller) |
| **LlamaIndex + Gemini** | Configured LlamaIndex Settings to use Gemini LLM and embedding models instead of OpenAI defaults |
| **Real-time UI performance** | Used `requestAnimationFrame` for motion detection, polling for inference, and debounced state updates |
| **Local-only operation** | Replaced Firebase Firestore with an in-memory ledger persisted to JSON |

---

## 📁 Project Structure

```
acousticIsleagenticai/
├── src/
│   ├── ai/
│   │   ├── genkit.ts                    # Genkit AI configuration
│   │   └── flows/
│   │       └── generate-dynamic-accompaniment.ts  # Main AI flow
│   ├── app/
│   │   ├── page.tsx                     # Main page
│   │   ├── layout.tsx                   # Root layout
│   │   └── api/
│   │       ├── orchestrate/route.ts     # Main pipeline endpoint
│   │       ├── ledger/route.ts          # Royalty ledger data
│   │       ├── stats/route.ts           # Live metrics
│   │       └── youtube-heritage/route.ts # YouTube search
│   ├── components/AcousticIsle/
│   │   ├── AcousticIsleMain.tsx         # Main app with landing page
│   │   ├── JamSession.tsx              # Live sandbox with camera
│   │   ├── OrchestrationGraph.tsx      # Animated agent visualization
│   │   ├── RoyaltyLedger.tsx           # Real-time royalty display
│   │   └── Visualizer.tsx              # Audio waveform visualizer
│   ├── services/
│   │   ├── stem-retrieval-service.ts   # LlamaIndex heritage retrieval
│   │   └── youtube-heritage-service.ts # YouTube Data API integration
│   ├── store/
│   │   └── local-ledger.ts             # In-memory royalty ledger
│   └── temporal/
│       ├── activities.ts               # Temporal activity definitions
│       ├── workflows.ts                # Temporal workflow definitions
│       ├── worker.ts                   # Temporal worker entry point
│       └── temporal-client.ts          # Temporal client singleton
├── .env.example                         # Environment variable template
├── package.json
└── README.md
```

---

## 🏆 Built For

**Gemini 3 NYC Hackathon 2025** — Empowering communities through AI-native solutions.

---

## 📜 License

This project was built from scratch during the hackathon. Open source for public review.
