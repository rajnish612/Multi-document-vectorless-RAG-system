from pageindex import PageIndexClient
import os
from utils.psycopg import get_conn
from dotenv import load_dotenv

load_dotenv()


class DocumentService:
    def __init__(self):
        self.pi_client = PageIndexClient(api_key=os.getenv("PAGE_INDEX_API"))

    def pdf_upload_service(self, file, userId, doc_name):
        try:
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
        except:
            conn.rollback()
        finally:
            conn.close()

    def retrieve_doc(self, userId, doc_id):
        try:
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
        except:
            conn.rollback
        finally:
            conn.close()

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
        except:
            conn.rollback()
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
        except:
            conn.rollback()
        finally:
            conn.close()

    def delete_doc(self, doc_id: str, user_id: str):
        conn = get_conn()
        try:
            self.pi_client.delete_document(doc_id)
        except:
            pass
        try:
            with conn.cursor() as curr:

                curr.execute(
                    "DELETE FROM messages WHERE doc_id = %s AND user_id = %s",
                    (doc_id, user_id),
                )

                curr.execute(
                    "DELETE FROM documents WHERE doc_id = %s AND user_id = %s",
                    (doc_id, user_id),
                )
                deleted = curr.rowcount
            conn.commit()
            return deleted
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
