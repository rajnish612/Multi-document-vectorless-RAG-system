from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Literal
from agents import *
from ingest import retrieve


class GraphState(TypedDict):
    query: str
    optimized_query: str
    retrieved_data: str
    # filtered_data: str
    final_answer: str


builder = StateGraph(GraphState)


def optimize_query_node(state: GraphState) -> GraphState:
    response = query_optimizer.invoke(
        {"messages": [{"role": "user", "content": f"QUERY: {state['query']}"}]}
    )

    return {"optimized_query": response["messages"][-1].content}


def retriever_node(state: GraphState) -> GraphState:
    data = retrieve(state["optimized_query"])
    return {"retrieved_data": data}


def filter_node(state: GraphState) -> GraphState:
    response = retrieve_data_optimizer.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": f"QUERY: {state['query']}   RETRIEVED_DATA: {state['retrieved_data']}",
                }
            ]
        }
    )
    return {"final_answer": response["messages"][-1].content}


def validator_node(state: GraphState) -> Literal["VALID", "INVALID"]:
    result = query_validator.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": f"QUERY: {state['query']}   RETRIEVED_DATA: {state['retrieved_data']}",
                }
            ]
        }
    )
    if "INVALID" in result["structured_response"].result:
        return "INVALID"
    else:
        return "VALID"


builder.add_node("optimize_query_node", optimize_query_node)
builder.add_node("retriever_node", retriever_node)
builder.add_node("filter_node", filter_node)
builder.add_edge(START, "optimize_query_node")
builder.add_edge("optimize_query_node", "retriever_node")
builder.add_conditional_edges(
    "retriever_node", validator_node, {"INVALID": END, "VALID": "filter_node"}
)
builder.add_edge("filter_node", END)
agent = builder.compile()
result = agent.invoke(
    {
        "query": """Total Number of
Shares
Purchased as Part
of Publicly
Announced Plans or
Program""",
        "optimized_query": "",
        "retrieved_data": "",
        "final_answer": "",
    }
)
print(result)
