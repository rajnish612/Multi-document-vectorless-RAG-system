from pageindex import PageIndexClient
import os
from utils.psycopg import get_conn
from dotenv import load_dotenv

load_dotenv()


class DocumentService:
    def __init__(self):
        self.pi_client = PageIndexClient(api_key=os.getenv("PAGE_INDEX_API"))

    def pdf_upload_service(self, file, userId, doc_name):
        result = self.pi_client.submit_document(file)
        print("result", result)
        doc_id = result["doc_id"]
        conn = get_conn()
        with conn.cursor() as curr:
            curr.execute(
                "INSERT INTO documents (user_id, doc_id,doc_name) VALUES (%s, %s, %s, %s) RETURNING *",
                (
                    userId,
                    doc_id,
                    doc_name,
                ),
            )
            doc = curr.fetchone()
        conn.commit()
        conn.close()
        return doc

    def retrieve_doc(self, userId, doc_id):
        conn = get_conn()
        with conn.cursor() as curr:
            curr.execute(
                "SELECT * FROM documents WHERE userId = %s AND docId = %s",
                (
                    userId,
                    doc_id,
                ),
            )
            return curr.fetchone()

    def search_docs(self, user_id, query):
        try:
            conn = get_conn()
            with conn.cursor() as curr:
                curr.execute(
                    "SELECT * FROM documents WHERE doc_name LIKE 's%' AND user_id = %s",
                    (
                        query,
                        user_id,
                    ),
                )
                return curr.fetchall()
        finally:
            conn.close()

    def retrieve_all(self, user_id):
        try:
            conn = get_conn()
            with conn.cursor() as curr:
                curr.execute(
                    "SELECT * FROM documents WHERE user_id = %s",
                    (user_id,),
                )
                return curr.fetchall()
        finally:
            conn.close()
