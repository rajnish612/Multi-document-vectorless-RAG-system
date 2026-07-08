from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Literal
from agents import *
from utils.retriever import retriever
from langchain_core.messages import HumanMessage
from langgraph.graph.message import add_messages, AnyMessage
from langgraph.checkpoint.memory import InMemorySaver
from typing import Annotated


class GraphState(TypedDict):
    query: str
    optimized_query: str
    retrieved_data: str
    messages: Annotated[list[AnyMessage], add_messages]
    doc_id: str
    final_answer: str


builder = StateGraph(GraphState)


def optimize_query_node(state: GraphState) -> GraphState:
    message = HumanMessage(content=f"QUERY: {state['query']}")

    response = query_optimizer.invoke({"messages": state["messages"] + [message]})

    return {
        "optimized_query": response["messages"][-1].content,
        "messages": [message, response["messages"][-1]],
    }


def retriever_node(state: GraphState) -> GraphState:
    context = retriever(state["optimized_query"], state["doc_id"])

    return {"retrieved_data": context}


def answer_node(state: GraphState) -> GraphState:
    message = HumanMessage(
        content=f"QUERY: {state['query']}   RETRIEVED_DATA: {state['retrieved_data']}"
    )

    response = answer_agent.invoke({"messages": state["messages"] + [message]})

    return {
        "final_answer": response["messages"][-1].content,
        "messages": [message, response["messages"][-1]],
    }


def validator_node(state: GraphState) -> Literal["VALID", "INVALID"]:
    messages = state["messages"] + [
        HumanMessage(
            content=f"QUERY: {state['query']}   RETRIEVED_DATA: {state['retrieved_data']}",
        )
    ]

    result = answer_validator.invoke({"messages": messages})

    if "INVALID" in result["structured_response"].result:
        return "INVALID"
    else:
        return "VALID"


def normal_chat_node(state: GraphState):
    message = HumanMessage(content=state["query"])
    response = answer_agent.invoke({"messages": state["messages"] + [message]})

    return {
        "final_answer": response["messages"][-1].content,
        "messages": [message, response["messages"][-1]],
    }


builder.add_node("optimize_query_node", optimize_query_node)
builder.add_node("retriever_node", retriever_node)
builder.add_node("answer_node", answer_node)
builder.add_node("normal_chat_node", normal_chat_node)
builder.add_edge(START, "optimize_query_node")
builder.add_edge("optimize_query_node", "retriever_node")
builder.add_conditional_edges(
    "retriever_node",
    validator_node,
    {"INVALID": "normal_chat_node", "VALID": "answer_node"},
)
builder.add_edge("normal_chat_node", END)
builder.add_edge("answer_node", END)
agent = builder.compile(checkpointer=InMemorySaver())
