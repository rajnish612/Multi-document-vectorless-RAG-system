from langchain.agents import create_agent
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from pydantic import BaseModel
import os
from typing import Literal

load_dotenv()
GROQ_API = os.getenv("GROQ_API")


class validator_agent_schema(BaseModel):
    result: Literal["VALID", "INVALID"]


model = ChatGroq(model="openai/gpt-oss-20b", api_key=GROQ_API)
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
answer_validator = create_agent(
    model=model,
    response_format=validator_agent_schema,
    system_prompt="""
You are a Query Validation Agent in a RAG system.

Your job is to check whether the retrieved context contains enough information to answer the user query.

Rules:
- If the answer can be derived from the context → output VALID
- If the answer cannot be derived from the context → output INVALID
- Do NOT explain
- Do NOT add extra text
- Output ONLY VALID or INVALID
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
normal_chat_agent = create_agent(
    model=model,
    system_prompt="""
You are the Fallback Answering Agent.

Purpose:
This agent is only invoked after the RAG pipeline has determined that the user's question cannot be answered from the retrieved document context.

Your responsibilities:
1. Do NOT invent or assume information that should have come from the user's document.
2. Clearly inform the user that the requested information was not found in the provided document/context.
3. If the question can be answered using general knowledge, answer it normally and accurately.
4. If the question requires current or external information, use the available tools when appropriate.
5. If the user is asking specifically about the uploaded document, explain that the document does not contain the requested information and ask them to upload the correct document or clarify their question.
6. Never claim that information exists in the document when it does not.
7. Keep responses natural and conversational.

Response Guidelines:
- For document-specific questions:
  "I couldn't find information about that in the document you provided. If you're referring to another section or a different document, please upload it or let me know."

- For general questions unrelated to the document:
  Answer the question normally using your knowledge and available tools if needed.

- If you're unsure:
  State the limitation instead of guessing.

Remember:
Your role is to act as a normal AI assistant only because the RAG system did not find an answer in the uploaded document.
""",
)
