from dotenv import load_dotenv

load_dotenv()

import tempfile
from graph import agent
from utils.psycopg import get_conn
from services.document_service import DocumentService
from services.message_service import MessageService
from services.user_service import UserService
from fastapi.responses import JSONResponse
from fastapi import FastAPI, Request, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import os
from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions
from svix.webhooks import Webhook, WebhookVerificationError

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

clerk_client = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))
doc_service = DocumentService()
message_service = MessageService()
user_service = UserService()

# ---------------------------------------------------------------------------
# Auth middleware — lightweight: JWT verify (local) + one DB SELECT
# No Clerk API calls on every request anymore.
# ---------------------------------------------------------------------------
UNPROTECTED_PATHS = {"/api/webhooks/clerk"}


@app.middleware("http")
async def verifyAuth(request: Request, call_next):
    # Allow preflight and webhook routes without auth
    if request.method == "OPTIONS" or request.url.path in UNPROTECTED_PATHS:
        return await call_next(request)

    # 1. Verify JWT locally — fast, no network call
    request_state = clerk_client.authenticate_request(
        request,
        AuthenticateRequestOptions(authorized_parties=[os.getenv("CLIENT_URL")]),
    )
    if not request_state.is_signed_in:
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

    payload = request_state.payload
    clerk_user_id = payload["sub"]

    # 2. Single fast DB SELECT — user was already synced by the webhook
    user = user_service.get_user(clerk_user_id)

    # Fallback: if user not yet in DB (e.g. webhook not configured yet),
    # fetch from Clerk API once and upsert — guarantees no lockouts.
    if not user:
        try:
            clerk_user = clerk_client.users.get(user_id=clerk_user_id)
            email = (
                clerk_user.email_addresses[0].email_address
                if clerk_user.email_addresses
                else None
            )
            user = user_service.upsert_user(clerk_user_id, email)
        except Exception:
            return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

    if not user:
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

    request.state.user = {
        "email": user["email"],
        "user_id": user["user_id"],
    }

    return await call_next(request)


# ---------------------------------------------------------------------------
# Clerk Webhook — saves user to DB on user.created / user.updated
# Zero per-request overhead; user is synced once here.
# ---------------------------------------------------------------------------
@app.post("/api/webhooks/clerk")
async def clerk_webhook(request: Request):
    webhook_secret = os.getenv("CLERK_WEBHOOK_SECRET", "")

    payload = await request.body()
    headers = dict(request.headers)

    # Verify the webhook signature using svix
    if webhook_secret:
        try:
            wh = Webhook(webhook_secret)
            event = wh.verify(payload, headers)
        except WebhookVerificationError:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    else:
        # If no secret configured, parse without verification (dev/testing only)
        import json
        event = json.loads(payload)

    event_type = event.get("type")

    if event_type in ("user.created", "user.updated"):
        data = event.get("data", {})
        clerk_user_id = data.get("id")
        email_addresses = data.get("email_addresses", [])
        email = email_addresses[0].get("email_address") if email_addresses else None

        if clerk_user_id:
            user_service.upsert_user(clerk_user_id, email)

    return {"success": True}


# ---------------------------------------------------------------------------
# Document routes
# ---------------------------------------------------------------------------
@app.post("/api/doc/upload")
async def upload_pdf(request: Request, pdf: UploadFile):
    user = request.state.user
    suffix = os.path.splitext(pdf.filename)[-1]

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await pdf.read())
        tmp_path = tmp.name

    try:
        doc = doc_service.pdf_upload_service(tmp_path, user["user_id"], pdf.filename)
    finally:
        os.remove(tmp_path)

    await pdf.close()
    if not doc:
        raise HTTPException(500, detail="Unable to upload document")
    return {
        "doc": doc,
        "message": "document successfully uploaded",
        "success": True,
    }


@app.post("/doc/{id}")
async def retrieve_doc(request: Request, doc_id: str):
    user = request.state.user
    doc = doc_service.retrieve_doc(userId=user["user_id"], doc_id=doc_id)
    if not doc:
        raise HTTPException(404, detail="doc not found")
    return {
        "doc": doc,
        "success": True,
        "message": "document retrieved successfully",
    }


@app.get("/api/docs")
async def read_item(request: Request):
    user = request.state.user
    docs = doc_service.retrieve_all(user_id=user["user_id"])
    if not docs or len(docs) == 0:
        raise HTTPException(404, detail="documents not found")
    return {
        "docs": docs,
        "success": True,
        "message": "documents retrieved successfully",
    }


@app.delete("/api/docs/{doc_id}")
async def delete_doc(request: Request, doc_id: str):
    user = request.state.user
    deleted_rows = doc_service.delete_doc(doc_id=doc_id, user_id=user["user_id"])
    if deleted_rows == 0:
        raise HTTPException(404, detail="Document not found or already deleted")
    return {
        "doc_id": doc_id,
        "success": True,
        "message": "Document deleted successfully",
    }


# ---------------------------------------------------------------------------
# Chat routes
# ---------------------------------------------------------------------------
@app.post("/api/chat/{doc_id}")
def chat(request: Request, doc_id, query):
    user = request.state.user
    result = agent.invoke(
        {
            "query": query,
            "optimized_query": "",
            "retrieved_data": "",
            "final_answer": "",
            "messages": [],
            "doc_id": doc_id,
        },
        # Scope conversation history per user+document so different
        # documents don't bleed into each other's chat history.
        {"configurable": {"thread_id": f"{user['user_id']}:{doc_id}"}},
    )
    message = message_service.save_message(
        user["user_id"],
        doc_id,
        query,
        result["final_answer"],
    )
    if not message:
        raise HTTPException(404, detail="unable to send message")
    return {
        "data": message["assistant_message"],
        "success": True,
        "message": "successfully sent message",
    }


@app.get("/api/chat/messages")
def get_all_messages(request: Request, doc_id):
    user = request.state.user
    messages = message_service.get_messages(user["user_id"], doc_id)
    return {
        "data": messages or [],
        "success": True,
        "message": "messages retrieved successfully",
    }
