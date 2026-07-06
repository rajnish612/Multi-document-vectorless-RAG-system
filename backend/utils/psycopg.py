import psycopg
from psycopg.rows import dict_row
import os


def get_conn():
    return psycopg.connect(os.getenv("DATABASE_URI"), row_factory=dict_row)
