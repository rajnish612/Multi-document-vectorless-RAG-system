from pageindex import PageIndexClient
import json
import bm25s
import os

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


def retriever(query, doc_id):
    retrievel_tree = create_retrievel_tree(doc_id)
    flat_tree = flatten_tree(retrievel_tree)
    corpus = create_corpus(flat_tree)

    corpus_tokens = bm25s.tokenize(corpus)
    retriever = bm25s.BM25()

    retriever.index(corpus_tokens)
    query_tokens = bm25s.tokenize(query)
    results, scores = retriever.retrieve(query_tokens, k=5)
    matched_nodes = find_nodes_by_idx(flat_tree, results)
    context = build_context(matched_nodes)
    return context
