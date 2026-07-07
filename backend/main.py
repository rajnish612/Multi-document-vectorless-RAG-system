from dotenv import load_dotenv

load_dotenv()
import tempfile
from retriever import retriever
from graph import agent
from utils.psycopg import get_conn
from typing import Annotated
from services.document_service import DocumentService
from services.message_service import MessageService
from fastapi.responses import JSONResponse
from fastapi import FastAPI, Request, Response, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import os
from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions

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


@app.middleware("http")
async def verifyAuth(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    request_state = clerk_client.authenticate_request(
        request,
        AuthenticateRequestOptions(authorized_parties=[os.getenv("CLIENT_URL")]),
    )
    print(request_state.is_signed_in)
    if not request_state.is_signed_in:
        return JSONResponse(
            status_code=401,
            content={"detail": "Unauthorized"},
        )
    payload = request_state.payload

    user = clerk_client.users.get(user_id=payload["sub"])

    email = None
    if user.email_addresses:
        email = user.email_addresses[0].email_address
    conn = get_conn()
    with conn.cursor() as curr:

        curr.execute(
            """
    INSERT INTO users (user_id, email)
    VALUES (%s, %s)
    ON CONFLICT (user_id)
    DO UPDATE SET email = EXCLUDED.email
    RETURNING *
    """,
            (payload["sub"], email),
        )
        created_user = curr.fetchone()

    conn.commit()
    conn.close()
    if not created_user:
        return JSONResponse(
            status_code=401,
            content={"detail": "Unauthorized"},
        )

    request.state.user = {
        "email": created_user["email"],
        "user_id": created_user["user_id"],
    }

    return await call_next(request)


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
    doc = doc_service.retrieve_doc(userId=user.user_id, doc_id=doc_id)
    if not doc:
        raise HTTPException(404, detail="doc not found")
    return {
        "doc": doc,
        "success": True,
        "message": "document retrieved successfully",
    }


@app.get("/api/docs")
def read_item(request: Request):

    user = request.state.user
    docs = doc_service.retrieve_all(user_id=user["user_id"])
    if not docs or len(docs) == 0:
        raise HTTPException(404, detail="documents not found")
    return {
        "docs": docs,
        "success": True,
        "message": "documents retrieved successfully",
    }


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
        {"configurable": {"thread_id": user["user_id"]}},
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
        "sucess": True,
        "message": "successfully sent message",
    }


@app.get("/api/chat/messages")
def get_all_messages(request: Request, doc_id):
    user = request.state.user
    messages = message_service.get_messages(user["user_id"], doc_id)
    if not messages:
        raise HTTPException(422,detail="Unable to retrieve messages")
    return {
        "data": messages,
        "sucess": True,
        "message": "successfully sent message",
    }
 
