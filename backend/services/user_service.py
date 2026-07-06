from utils.psycopg import conn


class UserService:
    def create_user(self, userId, email):
        with conn.cursor() as curr:
            curr.execute(
                "INSERT INTO users (userId, email) VALUES (%s, %s) ON CONFLICT (userId) DO NOTHING",
                (userId, email),
            )
        conn.commit()

    def retrieve_user(self, userId):
        with conn.cursor() as curr:
            curr.execute(
                "SELECT * FROM users WHERE userId = %s",
                (userId,),
            )
            return curr.fetchone()
