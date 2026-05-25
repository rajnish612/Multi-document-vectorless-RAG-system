from langchain_unstructured import UnstructuredLoader
from langchain_community.vectorstores.utils import filter_complex_metadata

# from unst
# from langchain_docling.loader import DoclingLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma

from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv
import os

load_dotenv()

GOOGLE_GENAI_API = os.getenv("GOOGLE_GENAI_API")
embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vector_store = Chroma(
    collection_name="multi_rag",
    embedding_function=embedding,
    persist_directory="./chroma_db",
)


def build_vector_db(pdfPath: str):
    loader = UnstructuredLoader(
        pdfPath,
    )
    docs = []
    for doc in loader.lazy_load():
        docs.append(doc)
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=250)

    docs = text_splitter.split_documents(docs)
    docs = filter_complex_metadata(docs)

    vector_store.add_documents(docs)


def retrieve(query: str):

    results = vector_store.similarity_search(query)
    # print("results", results)
    final_result = [result.page_content for result in results]
    # print("final result", final_result)
    return "\n\n".join(final_result)


# build_vector_db("./Apple.pdf")
# print(retrieve("What is this document about?"))
