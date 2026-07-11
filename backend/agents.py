from langchain.agents import create_agent
from dotenv import load_dotenv
from langchain_groq import ChatGroq
import os

load_dotenv()
GROQ_API = os.getenv("GROQ_API")


model = ChatGroq(model=os.getenv("GROQ_MODEL"), api_key=GROQ_API)
query_optimizer = create_agent(
    model=model,
    system_prompt="""
You are a Query Rewriting Agent for a RAG system.

Rewrite the query ONLY for semantic search.

Rules:
- NEVER remove numbers (years, amounts)
- ALWAYS preserve table-related intent
- ALWAYS keep entities (Apple, segment, sales, tax, etc.)
- DO NOT shorten if it loses meaning
- DO NOT answer the question
- Output ONLY the rewritten query

If query contains years (2023, 2024, 2025), ALWAYS keep them.

Examples:
User: reportable segment for 2025 2024 2023
Output: reportable segment net sales segment breakdown 2025 2024 2023
""",
)
answer_agent = create_agent(
    model=model,
    system_prompt="""
You are a RAG Answering Agent.

Rules:
- Answer ONLY using the retrieved context.
- If relevant information exists, provide the answer clearly.
- Use table data when available.
- Be concise and factual.
- Only say "Not found in the provided context." when absolutely no relevant information exists.
""",
)
