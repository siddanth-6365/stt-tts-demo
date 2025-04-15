import os
import dotenv
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone

# Set environment variables for tokenizers and threading (if needed)
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

# Load environment variables from .env file
dotenv.load_dotenv()

# Initialize the Hugging Face Sentence Transformer model.
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# Retrieve Pinecone API key from environment variables.
pinecone_api_key = os.getenv("PINECONE_API_KEY")

# Create an instance of the Pinecone client using the new API.
pc = Pinecone(api_key=pinecone_api_key)

# Define your index name (this should be the same as used during upsert).
index_name = "zendalona-projects"

# Connect to the existing Pinecone index.
index = pc.Index(index_name)

# Define your query text. Modify this sample query as needed.
query_text = "what all projects do you have currently"
print(f"Query Text: {query_text}")

# Generate an embedding for the query using the same model.
query_embedding = model.encode(query_text).tolist()

# Query the index for the top 5 most similar vectors, including metadata.
result = index.query(vector=query_embedding, top_k=5, include_metadata=True)

# Display the query results.
print("Query results:")
for match in result["matches"]:
    print(f"ID: {match['id']}")
    print(f"Score: {match['score']:.4f}")
    metadata = match.get("metadata", {})
    print(f"Metadata: {metadata}")
    print("-" * 40)
