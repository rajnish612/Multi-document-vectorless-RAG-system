from pageindex import PageIndexClient
import json
import bm25s
import os
from agents import answer_agent
from utils.redis import r

pi_client = PageIndexClient(os.getenv("PAGE_INDEX_API"))

doc_id = "pi-cmpxt6mh203aw01qub020kffu"


def get_index_tree(doc_id):

    tree_result = pi_client.get_tree(doc_id, node_summary=True)
    pageindex_tree = tree_result.get("result", [])
    return pageindex_tree


def create_retrievel_tree(nodes):
    output = []
    for node in nodes:
        data = {
            "node_id": node.get("node_id", "?"),
            "title": node.get("title", "?"),
            "page_index": node.get("page_index", "?"),
            "summary": node.get("summary", "?"),
            "text": node.get("text", ""),
        }
        if node.get("nodes"):
            data["children"] = create_retrievel_tree(node["nodes"])
        output.append(data)

    return output


def flatten_tree(nodes):
    docs = []

    for node in nodes:
        docs.append(
            {
                "node_id": node["node_id"],
                "title": node["title"],
                "summary": node["summary"],
                "corpus_text": f"{node['title']} {node['summary']}",
                "text": node["text"],
            }
        )

        if node.get("children"):
            docs.extend(flatten_tree(node["children"]))

    return docs


def create_corpus(nodes):
    corpus = [node["corpus_text"] for node in nodes]
    return corpus


def find_nodes_by_idx(flat_tree, results):
    out = [flat_tree[idx] for idx in results[0]]
    return out


def build_context(matched_nodes):
    context = "\n\n".join(f"""
    Title: {node['title']}

    Summary: {node['summary']}

    Content:
    {node['text']}
    """ for node in matched_nodes)
    return context


def _redis_get_flat_tree(doc_id: str) -> list | None:
    try:
        cached = r.get(f"flat_tree:{doc_id}")
        if cached:
            return json.loads(cached)
    except Exception as e:
        print(e)
    return None


def _redis_set_flat_tree(doc_id: str, flat_tree: list) -> None:
    """Persist flat_tree to Redis with TTL. Silently ignores errors."""
    try:
        print("Writing to Redis:", f"flat_tree:{doc_id}")
        r.set(
            f"flat_tree:{doc_id}",
            json.dumps(flat_tree),
        )
    except Exception as e:
        print(e)
        return None


def retriever(query, doc_id):
    index_tree = get_index_tree(doc_id)
    flat_tree = ""
    flat_tree = _redis_get_flat_tree(doc_id)
    if not flat_tree:
        retrievel_tree = create_retrievel_tree(index_tree)

        flat_tree = flatten_tree(retrievel_tree)
        _redis_set_flat_tree(doc_id, flat_tree)

    corpus = create_corpus(flat_tree)

    corpus_tokens = bm25s.tokenize(corpus)
    retriever = bm25s.BM25()

    retriever.index(corpus_tokens)
    query_tokens = bm25s.tokenize(query)
    results, scores = retriever.retrieve(query_tokens, k=3)
    matched_nodes = find_nodes_by_idx(flat_tree, results)
    context = build_context(matched_nodes)
    return context
