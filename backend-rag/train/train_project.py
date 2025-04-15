import os
import json
import re
from langchain.docstore.document import Document
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS

# Set directories for project JSON files and for saving indexes.
PROJECTS_DIR = "/Users/siddanthreddy/Code/open-source/stt-tts-demo/backend-rag/projects_data"
INDEXES_DIR = "/Users/siddanthreddy/Code/open-source/stt-tts-demo/rag/indexes"
os.makedirs(INDEXES_DIR, exist_ok=True)

def chunk_text(text, chunk_size=150, overlap=50):
    """
    Splits text into chunks of approximately 'chunk_size' words with 'overlap' words overlap.
    You can adjust chunk_size and overlap based on your embedding model's context length.
    """
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
        i += (chunk_size - overlap)
    return chunks

def sanitize_filename(text):
    """
    Sanitizes a string to be filesystem friendly by removing unwanted characters.
    """
    sanitized = text.encode("ascii", "ignore").decode()
    sanitized = re.sub(r'[^a-zA-Z0-9]+', '_', sanitized)
    return sanitized.strip('_').lower()

def load_project_json(filepath):
    """
    Loads the JSON file containing the project data.
    """
    with open(filepath, "r", encoding="utf8") as f:
        return json.load(f)

def extract_text_recursively(data, parent_key=""):
    """
    Recursively extract text content from any nested JSON structure.
    The function returns a list of tuples: (text_content, metadata) where metadata includes a "source" key
    representing the hierarchical path.
    """
    texts = []
    if isinstance(data, dict):
        for key, value in data.items():
            combined_key = f"{parent_key}.{key}" if parent_key else key
            texts.extend(extract_text_recursively(value, parent_key=combined_key))
    elif isinstance(data, list):
        for idx, item in enumerate(data):
            combined_key = f"{parent_key}[{idx}]"
            texts.extend(extract_text_recursively(item, parent_key=combined_key))
    elif isinstance(data, str):
        if data.strip():
            texts.append((data, {"source": parent_key}))
    else:
        # For numbers or other types, simply convert to string.
        texts.append((str(data), {"source": parent_key}))
    return texts

def build_documents(project_data):
    """
    Process the entire project_data JSON into a list of Document objects.
    Each document includes a text chunk (created by chunking long strings) and metadata, such as the originating key and project name.
    """
    docs = []
    # Use the project 'name' for metadata.
    title = project_data.get("name", "untitled")
    # Recursively extract all text entries.
    extracted_entries = extract_text_recursively(project_data)
    
    for text, meta in extracted_entries:
        # If text is long, chunk it; otherwise, use the text as a single chunk.
        chunks = chunk_text(text) if len(text.split()) > 100 else [text]
        for chunk in chunks:
            # Add project title to metadata.
            meta_with_title = dict(meta)
            meta_with_title["project"] = title
            docs.append(Document(page_content=chunk, metadata=meta_with_title))
    return docs

def main():
    # Process a single project file (for multiple projects, this could be wrapped in a loop).
    project_file = os.path.join(PROJECTS_DIR, "accessible_coconut.json")
    project_data = load_project_json(project_file)
    documents = build_documents(project_data)
    print(f"Created {len(documents)} documents from project data.")

    # Initialize the embedding model (ensure required libraries like 'sentence-transformers' are installed).
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    
    # Create the FAISS vector index from the documents.
    vector_index = FAISS.from_documents(documents, embedding_model)
    
    # Use the project name to create a folder for the index.
    project_name = project_data.get("name", "untitled")
    project_name_slug = sanitize_filename(project_name)
    index_path = os.path.join(INDEXES_DIR, project_name_slug)
    
    vector_index.save_local(index_path)
    print(f"Index for '{project_name}' saved at {index_path}")

if __name__ == "__main__":
    main()
