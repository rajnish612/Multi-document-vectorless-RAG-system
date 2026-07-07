from dotenv import load_dotenv

load_dotenv()
from utils.psycopg import get_conn


class MessageService:
    def save_message(self, user_id, doc_id, user_message, ai_message):
        conn = get_conn()
        with conn.cursor() as curr:
            curr.execute(
                """
                INSERT INTO messages (user_id, doc_id, text, role)
                VALUES (%s, %s, %s, %s)
                RETURNING *;
                """,
                (user_id, doc_id, user_message, "User"),
            )
            user_msg = curr.fetchone()

            curr.execute(
                """
                INSERT INTO messages (user_id, doc_id, text, role)
                VALUES (%s, %s, %s, %s)
                RETURNING *;
                """,
                (user_id, doc_id, ai_message, "Assistant"),
            )
            ai_msg = curr.fetchone()
        conn.commit()
        conn.close()
        return {
            "user_message": user_msg,
            "assistant_message": ai_msg,
        }

    def get_messages(self, user_id, doc_id):
        conn = get_conn()
        with conn.cursor() as curr:
            curr.execute(
                """SELECT * FROM messages WHERE user_id = %s AND doc_id = %s""",
                (user_id, doc_id),
            )
            messages = curr.fetchall()
        conn.close()
        return messages
