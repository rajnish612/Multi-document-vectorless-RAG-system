from pageindex import PageIndexClient
import json
import bm25s
import os
from utils.redis import r

pi_client = PageIndexClient(os.getenv("PAGE_INDEX_API"))

# ---------------------------------------------------------------------------
# In-memory BM25 cache — keyed by doc_id.
# Avoids rebuilding the index on every single chat message.
# ---------------------------------------------------------------------------
_bm25_cache: dict[str, tuple[bm25s.BM25, list]] = {}


# ---------------------------------------------------------------------------
# Tree helpers
# ---------------------------------------------------------------------------

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
    return [node["corpus_text"] for node in nodes]


def find_nodes_by_idx(flat_tree, results):
    return [flat_tree[idx] for idx in results[0]]


def build_context(matched_nodes):
    context = "\n\n".join(
        f"""
    Title: {node['title']}

    Summary: {node['summary']}

    Content:
    {node['text']}
    """
        for node in matched_nodes
    )
    return context


# ---------------------------------------------------------------------------
# Redis helpers — cache both the flat_tree AND the raw index_tree
# so the PageIndex API is only called when the cache is cold.
# ---------------------------------------------------------------------------

def _redis_get(key: str):
    try:
        cached = r.get(key)
        if cached:
            return json.loads(cached)
    except Exception as e:
        print(f"[Redis GET error] {key}: {e}")
    return None


def _redis_set(key: str, value, ttl: int = 86400):
    """Persist value to Redis. TTL defaults to 24 h."""
    try:
        r.set(key, json.dumps(value), ex=ttl)
    except Exception as e:
        print(f"[Redis SET error] {key}: {e}")


# ---------------------------------------------------------------------------
# BM25 cache helpers
# ---------------------------------------------------------------------------

def _get_bm25(doc_id: str, flat_tree: list) -> bm25s.BM25:
    """Return cached BM25 index for doc_id, building it if needed."""
    if doc_id in _bm25_cache:
        cached_bm25, cached_tree = _bm25_cache[doc_id]
        # Invalidate if the tree has changed (e.g. doc re-uploaded)
        if len(cached_tree) == len(flat_tree):
            return cached_bm25

    corpus = create_corpus(flat_tree)
    corpus_tokens = bm25s.tokenize(corpus)
    bm25_index = bm25s.BM25()
    bm25_index.index(corpus_tokens)
    _bm25_cache[doc_id] = (bm25_index, flat_tree)
    return bm25_index


# ---------------------------------------------------------------------------
# Main retriever
# ---------------------------------------------------------------------------

def retriever(query: str, doc_id: str, k: int = 3) -> str:
    # 1. Try Redis for the flat_tree (skips PageIndex API + tree processing)
    flat_tree = _redis_get(f"flat_tree:{doc_id}")

    if not flat_tree:
        # Cache miss — fetch from PageIndex API, process, and cache
        print(f"[Retriever] Cache miss for {doc_id}, fetching from PageIndex…")
        tree_result = pi_client.get_tree(doc_id, node_summary=True)
        index_tree = tree_result.get("result", [])
        retrieval_tree = create_retrievel_tree(index_tree)
        flat_tree = flatten_tree(retrieval_tree)
        _redis_set(f"flat_tree:{doc_id}", flat_tree)
    else:
        print(f"[Retriever] Cache hit for {doc_id}")

    # 2. Get (or build) the BM25 index — cached in memory per doc_id
    bm25_index = _get_bm25(doc_id, flat_tree)

    # 3. Retrieve top-k nodes
    query_tokens = bm25s.tokenize(query)
    results, scores = bm25_index.retrieve(query_tokens, k=k)
    matched_nodes = find_nodes_by_idx(flat_tree, results)

    return build_context(matched_nodes)
