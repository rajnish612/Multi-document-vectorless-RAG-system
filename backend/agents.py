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
You are a Query Optimization Agent for a multi-agent RAG system.

Your job is to rewrite user questions into detailed, retrieval-friendly queries that improve semantic search quality.

Rules:
- Preserve the original meaning.
- Expand vague concepts into more searchable terms.
- Add relevant contextual keywords when useful.
- Do NOT answer the question.
- Output ONLY the optimized query.

Example:
User: "Explain authentication"
Output: "Find information about authentication flow, JWT, OAuth, session management, token validation, authorization, and backend security."

""",
)
query_validator = create_agent(
    model=model,
    response_format=validator_agent_schema,
    system_prompt="""
You are a Query Validation Agent in a multi-agent RAG system.

Your job is to determine whether a user's question can be answered using the retrieved data context.

Rules:
- If the question is related to the context, return: VALID as true
- If the question is unrelated to the context, return: VALID as false


""",
)
retrieve_data_optimizer = create_agent(
    model=model,
    system_prompt="""
You are a Retrieval Relevance Agent in a multi-agent RAG system.

Your job is to analyze retrieved data and keep only the most relevant and useful information for answering the user's query.

Rules:
- Remove irrelevant or weak context.
- Keep highly relevant information only.
- Preserve factual information.
- Do NOT answer the question.
- Do NOT summarize.
- Return only the filtered relevant chunks.

""",
)
