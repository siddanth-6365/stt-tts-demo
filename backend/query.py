import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

import faiss
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import pipeline

def load_faiss_index(index_path: str):
    index = faiss.read_index(index_path)
    return index

def load_passages(passages_path: str):
    with open(passages_path, "rb") as f:
        passages = pickle.load(f)
    return passages

def compute_query_embedding(query: str, model: SentenceTransformer) -> np.ndarray:
    query_embedding = model.encode([query], convert_to_numpy=True)
    return query_embedding

def retrieve_passages(query: str, sbert_model: SentenceTransformer, index, passages: list, top_k: int = 5):
    query_embedding = compute_query_embedding(query, sbert_model)
    distances, indices = index.search(query_embedding, top_k)
    results = [passages[i] for i in indices[0]]
    return results

def generate_answer(query: str, retrieved_passages: list, gen_pipeline) -> str:
    # Combine retrieved passages into a context string
    context = " ".join(retrieved_passages)
    # Updated system prompt for better responses:
    system_prompt = (
        "You are ZendalonaBot, an expert on Zendalona's accessible open-source projects. "
        "Provide a clear, concise, and accurate answer to the user's question based solely on the given context. "
        "Avoid repetition and focus on delivering an informative response. If the context is incomplete, state what extra details might be needed."
    )
    prompt = f"{system_prompt}\n\nContext: {context}\n\nQuestion: {query}\nAnswer:"
    # Using a more powerful generative model for improved response quality.
    answer = gen_pipeline(prompt, max_length=300, min_length=100, num_return_sequences=1, truncation=True)[0]['generated_text']
    return answer

def main():
    # Load the FAISS index and passages from disk.
    index = load_faiss_index("faiss_index.index")
    passages = load_passages("passages.pkl")
    
    print("Knowledge base loaded. Ready for queries.")
    
    sbert_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    
    # Use a more capable generative model ("google/flan-t5-base")
    gen_pipeline = pipeline("text2text-generation", model="google/flan-t5-base")
    
    while True:
        query = input("Enter your question (or 'exit' to quit): ")
        if query.lower() == "exit":
            break
        
        retrieved = retrieve_passages(query, sbert_model, index, passages, top_k=5)
        print("\nRetrieved Passages:")
        for i, passage in enumerate(retrieved):
            print(f"{i+1}. {passage}\n")
        
        answer = generate_answer(query, retrieved, gen_pipeline)
        print("Generated Answer:")
        print(answer)
        print("-" * 50)

if __name__ == "__main__":
    main()
