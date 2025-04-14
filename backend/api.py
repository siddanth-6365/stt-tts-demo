import os
import pickle
import faiss
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

class QueryRequest(BaseModel):
    question: str

app = FastAPI()

# Global variables for the preloaded components
FAISS_INDEX_PATH = "faiss_index.index"
PASSAGES_PATH = "passages.pkl"
SBERT_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
TOP_K = 5

# Load the FAISS index and passages once at startup.
def load_faiss_index(index_path: str):
    index = faiss.read_index(index_path)
    return index

def load_passages(passages_path: str):
    with open(passages_path, "rb") as f:
        passages = pickle.load(f)
    return passages

def compute_query_embedding(query: str, model: SentenceTransformer) -> np.ndarray:
    return model.encode([query], convert_to_numpy=True)

def retrieve_passages(query: str, model: SentenceTransformer, index, passages: list, top_k: int = TOP_K):
    query_embedding = compute_query_embedding(query, model)
    distances, indices = index.search(query_embedding, top_k)
    results = [passages[i] for i in indices[0]]
    return results

# Preload components at startup
index = load_faiss_index(FAISS_INDEX_PATH)
passages = load_passages(PASSAGES_PATH)
sbert_model = SentenceTransformer(SBERT_MODEL_NAME)

@app.post("/retrieve")
async def get_retrieved_passages(query_req: QueryRequest):
    try:
        retrieved = retrieve_passages(query_req.question, sbert_model, index, passages, TOP_K)
        return {"retrieved_passages": retrieved}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Start the server when running the file directly.
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
