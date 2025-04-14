import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"


import json
import faiss
import numpy as np
import pickle
from sentence_transformers import SentenceTransformer

def load_json(file_path: str) -> list:
    """
    Load the JSON file containing project data and extract passages.
    Combines the title and description for each project.
    """
    with open(file_path, "r") as f:
        data = json.load(f)
    passages = []
    for project in data.get("projects", []):
        title = project.get("title", "")
        description = project.get("description", "")
        # Combine title and description to create a comprehensive passage.
        text = f"{title}. {description}"
        passages.append(text)
    return passages

def compute_embeddings(passages: list, model: SentenceTransformer) -> np.ndarray:
    """
    Compute embeddings for the list of passages in batches to manage memory usage.
    """
    batch_size = 2
    all_embeddings = []
    
    for i in range(0, len(passages), batch_size):
        batch = passages[i:i + batch_size]
        print(f"Processing batch {i//batch_size + 1}/{(len(passages)-1)//batch_size + 1}")
        batch_embeddings = model.encode(batch, convert_to_numpy=True)
        all_embeddings.append(batch_embeddings)
    
    return np.vstack(all_embeddings)

def build_faiss_index(embeddings: np.ndarray):
    """
    Build a FAISS index using L2 distance for similarity search.
    """
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    return index

def main():
    try:
        json_file = "zendalona_projects.json"
        print("Loading projects from JSON file...")
        passages = load_json(json_file)
        print(f"Total passages obtained: {len(passages)}")
        if passages:
            print("Example passage:", passages[0][:100])
        
        print("Loading Sentence-BERT model...")
        sbert_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

        print("Computing embeddings...")
        embeddings = compute_embeddings(passages, sbert_model)
        
        print("Building FAISS index...")
        index = build_faiss_index(embeddings)
        
        # Save the FAISS index and the passages to disk for later use
        faiss.write_index(index, "faiss_index.index")
        with open("passages.pkl", "wb") as f:
            pickle.dump(passages, f)
        
        print("Knowledge base training complete. Index and passages saved.")
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        raise

if __name__ == "__main__":
    main()
