from langchain_unstructured import UnstructuredLoader

# from langchain_community.vectorstores.utils import filter_complex_metadata
from langchain_core.documents import Document

# from unst
# from langchain_docling.loader import DoclingLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma

from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv
import os

load_dotenv()

GOOGLE_GENAI_API = os.getenv("GOOGLE_GENAI_API")
embedding = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")
text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=250)

vector_store = Chroma(
    collection_name="multi_rag",
    embedding_function=embedding,
    persist_directory="./chroma_db",
)


def build_vector_db(pdfPath: str):
    loader = UnstructuredLoader(
        pdfPath,
        api_key=os.getenv("UNSTRUCTURED_API_KEY"),
        strategy="hi_res",
        partition_via_api=True,
    )
    processed_docs = []
    for doc in loader.lazy_load():

        if doc.metadata.get("category") == "Table":

            processed_docs.append(
                Document(
                    page_content=doc.page_content,
                    metadata={**doc.metadata},
                )
            )

        else:

            split_docs = text_splitter.split_documents([doc])

            processed_docs.extend(split_docs)

    vector_store.add_documents(processed_docs)


def retrieve(query: str):

    results = vector_store.similarity_search(query)
    # return results
    return "\n\n".join([doc.page_content for doc in results])


# build_vector_db("./APPLE.pdf")

print(retrieve("reportable segment for 2025 2024 2023"))
