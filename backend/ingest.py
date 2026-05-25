from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma

# from langchain_google_genai.embeddings import GoogleGenerativeAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from dotenv import load_dotenv
import os

load_dotenv()

GOOGLE_GENAI_API = os.getenv("GOOGLE_GENAI_API")
embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
# embedding = GoogleGenerativeAIEmbeddings(
#     api_key=GOOGLE_GENAI_API, model="gemini-embedding-001"
# )


def build_vector_db(pdfPath: str):
    loader = PyPDFLoader(pdfPath)
    docs = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=250)

    # text_chunks = [chunk.page_content for chunk in text_splitter.split_documents(docs)]
    docs = text_splitter.split_documents(docs)
    Chroma.from_documents(
        documents=docs,
        embedding=embedding,
        persist_directory="./chromadb",
    )


def retrieve(query: str):
    db = Chroma(
        embedding_function=embedding,
        persist_directory="./chromadb",
    )
    results = db.similarity_search(query)
    final_result = [result.page_content for result in results]
    return "\n\n".join(final_result)


build_vector_db("./APPLE.pdf")
