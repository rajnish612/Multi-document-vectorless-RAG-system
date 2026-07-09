from utils.psycopg import get_conn


class UserService:
    def upsert_user(self, user_id: str, email: str):
        """
        Called by the Clerk webhook on user.created / user.updated.
        Inserts a new user or updates their email if already present.
        """
        conn = get_conn()
        try:
            with conn.cursor() as curr:
                curr.execute(
                    """
                    INSERT INTO users (user_id, email)
                    VALUES (%s, %s)
                    ON CONFLICT (user_id)
                    DO UPDATE SET email = EXCLUDED.email
                    RETURNING *
                    """,
                    (user_id, email),
                )
                user = curr.fetchone()
            conn.commit()
            return user
        finally:
            conn.close()

    def get_user(self, user_id: str):
        """
        Fast single SELECT used by the auth middleware on every request.
        Returns the user row or None if not found.
        """
        conn = get_conn()
        try:
            with conn.cursor() as curr:
                curr.execute(
                    "SELECT * FROM users WHERE user_id = %s",
                    (user_id,),
                )
                return curr.fetchone()
        finally:
            conn.close()
