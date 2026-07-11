# MultiRAG — AI Document Intelligence

<div align="center">

![MultiRAG](https://img.shields.io/badge/MultiRAG-AI%20Document%20Intelligence-6366f1?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![LangGraph](https://img.shields.io/badge/LangGraph-RAG%20Pipeline-orange?style=for-the-badge)

**Upload any document. Ask anything. Get precise, context-aware answers.**

</div>

---

## What is MultiRAG?

MultiRAG is a full-stack AI-powered document question-answering system. Upload a PDF (or DOCX / TXT), and start chatting with it instantly. The backend uses a LangGraph RAG pipeline with BM25 retrieval and Redis caching — so answers are fast and grounded entirely in your document.

---

## Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| **Next.js 15** (App Router) | React framework with file-based routing |
| **Clerk** | Authentication (sign-in, sign-up, session management) |
| **Zustand** | Client-side state (selected document persists across routes) |
| **Lucide React** | Icons |
| **Vanilla CSS** | Custom design system |

### Backend
| Tech | Purpose |
|------|---------|
| **FastAPI** | REST API server |
| **LangGraph** | Stateful RAG pipeline (optimize → retrieve → answer) |
| **Groq** | LLM inference (query optimizer + answer agent) |
| **PageIndex** | Document indexing — structured tree extraction |
| **BM25s** | Keyword-based retrieval over document nodes |
| **Redis** | Cache for document flat-trees (avoids repeated PageIndex API calls) |
| **Neon PostgreSQL** | Persistent storage for users, documents, and chat history |
| **Clerk** | JWT verification in middleware + webhook user sync |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                │
│  /main/documents  ←→  Zustand  ←→  /main/chat       │
│            Clerk Auth (JWT)                          │
└────────────────────┬────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────┐
│                   Backend (FastAPI)                  │
│                                                      │
│  Middleware: Clerk JWT verify → DB user lookup       │
│                                                      │
│  POST /api/chat/{doc_id}                             │
│    └─► LangGraph Pipeline                            │
│          ├─ optimize_query_node  (Groq LLM)          │
│          ├─ retriever_node       (BM25 + Redis)      │
│          └─ answer_node          (Groq LLM)          │
│                                                      │
│  POST /api/webhooks/clerk  → upsert user in DB       │
└──────────────────────────────────────────────────────┘
```

### RAG Pipeline (LangGraph)

```
START
  │
  ▼
optimize_query_node   — Rewrites the query for better BM25 keyword matching
  │                     (preserves numbers, entities, table intent)
  ▼
retriever_node        — Fetches flat document tree from Redis (or PageIndex on miss)
  │                     Builds / reuses BM25 index, retrieves top-3 nodes
  ▼
answer_node           — Answers strictly from retrieved context via Groq LLM
  │
  ▼
END
```

Conversation history is persisted per `user_id + doc_id` thread via `InMemorySaver`.

---

## Project Structure

```
multirag/
├── backend/
│   ├── main.py                  # FastAPI app, middleware, routes
│   ├── graph.py                 # LangGraph RAG pipeline
│   ├── agents.py                # Query optimizer + answer agent (Groq)
│   ├── services/
│   │   ├── document_service.py  # PageIndex upload, DB CRUD
│   │   ├── message_service.py   # Chat history persistence
│   │   └── user_service.py      # User upsert / lookup
│   ├── utils/
│   │   ├── retriever.py         # BM25 retrieval + Redis caching
│   │   ├── psycopg.py           # PostgreSQL connection
│   │   └── redis.py             # Redis client
│   ├── .env                     # Secret keys (never commit)
│   ├── .env.example             # Template — copy this
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── main/
│   │   │   ├── documents/       # /main/documents route
│   │   │   └── chat/            # /main/chat route
│   │   ├── components/
│   │   │   ├── Aside.tsx        # Sidebar with route-based active state
│   │   │   ├── Document.tsx     # Upload, list, delete documents
│   │   │   └── Chats.tsx        # Chat interface with history
│   │   ├── api/api.ts           # API call helpers
│   │   └── zustand/stores/
│   │       └── DocumentStore.ts # Selected document (survives navigation)
│   ├── .env                     # Clerk keys (never commit)
│   └── .env.example             # Template — copy this
│
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- Redis (or use Docker)
- Accounts on: [Clerk](https://clerk.com), [Groq](https://console.groq.com), [PageIndex](https://pageindex.ai), [Neon](https://neon.tech)

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/multirag.git
cd multirag
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Fill in your keys in .env
```

### 3. Frontend setup

```bash
cd frontend

npm install

# Configure environment
cp .env.example .env
# Fill in your Clerk keys in .env
```

### 4. Set up Clerk Webhook

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → **Webhooks** → **Add Endpoint**
2. Set URL to `https://your-backend-url/api/webhooks/clerk`
3. Subscribe to events: `user.created`, `user.updated`
4. Copy the **Signing Secret** → paste into `backend/.env` as `CLERK_WEBHOOK_SECRET`

> **Why?** The webhook syncs new users into your database on first sign-up, so the backend doesn't need to call the Clerk API on every request.

### 5. Database setup

Run this SQL in your Neon console to create the required tables:

```sql
CREATE TABLE users (
  user_id   TEXT PRIMARY KEY,
  email     TEXT
);

CREATE TABLE documents (
  doc_id    TEXT PRIMARY KEY,
  user_id   TEXT NOT NULL,
  doc_name  TEXT NOT NULL
);

CREATE TABLE messages (
  id               SERIAL PRIMARY KEY,
  user_id          TEXT NOT NULL,
  doc_id           TEXT NOT NULL,
  user_message     TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  created_at       TIMESTAMP DEFAULT NOW()
);
```

---

### 6. Run locally

**Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

### Docker (all-in-one)

```bash
docker-compose up --build
```

This starts:
- **Backend** on port `8000`
- **Frontend** on port `3000`
- **Redis** on port `6379`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `GROQ_API` | Groq API key for LLM inference | [console.groq.com](https://console.groq.com) |
| `PAGE_INDEX_API` | PageIndex API key for document indexing | [pageindex.ai](https://pageindex.ai) |
| `CLERK_SECRET_KEY` | Clerk secret key for JWT verification | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Webhook signing secret | Clerk Dashboard → Webhooks |
| `DATABASE_URI` | Neon PostgreSQL connection string | [neon.tech](https://neon.tech) |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` locally |

### Frontend (`frontend/.env`)

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (public) | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk secret key (server-side) | Clerk Dashboard → API Keys |

---

## Key Features

- 📄 **Upload documents** — PDF, DOCX, TXT
- 💬 **Chat with any document** — answers grounded in document context only
- 🧠 **Query optimization** — rewrites queries for better BM25 keyword matching
- ⚡ **Redis caching** — document tree cached for 24h, BM25 index cached in memory
- 🔐 **Clerk authentication** — JWT-based, lightweight middleware
- 📝 **Persistent chat history** — per user + document thread, stored in PostgreSQL
- 🎨 **Premium dark UI** — glassmorphism, micro-animations, skeleton loaders
- 🛡️ **Proper error handling** — retry buttons, loading states, graceful fallbacks
- 🗑️ **Delete documents** — cleans up PageIndex + database + chat history

---

## Demo

A demo document (**Apple Inc. Annual Report**) is pre-loaded and available to all users without sign-up. Click **Chat** next to `Apple.pdf` to try it instantly.

---

## License

MIT
