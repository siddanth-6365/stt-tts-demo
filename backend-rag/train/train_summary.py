import os
import json
from sentence_transformers import SentenceTransformer
import dotenv
import re
from pinecone import Pinecone, ServerlessSpec

os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

dotenv.load_dotenv()

json_file = './zendalona_projects.json'
with open(json_file, 'r') as f:
    data = json.load(f)
projects = data['projects']

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# Use the sanitized project title as unique ID.
def sanitize_id(text):
    """
    Sanitize a string to ensure it is ASCII-only and URL/ID friendly.
    Replace non-ascii characters, convert to lower case, and replace spaces with underscores.
    """
    sanitized = text.encode("ascii", "ignore").decode()
    # Replace any non-alphanumeric characters (except underscores) with underscores.
    sanitized = re.sub(r'[^a-zA-Z0-9_]', '_', sanitized)
    # Replace multiple underscores with a single underscore.
    sanitized = re.sub(r'__+', '_', sanitized)
    return sanitized.lower()

# Generate embeddings based on project descriptions.
project_embeddings = {}
for project in projects:
    title = project['title']
    description = project['description']
    
    embedding = model.encode(description)
    project_embeddings[title] = {
        "embedding": embedding,
        "description": description
    }

first_project = projects[0]['title']
print(f"Preview embedding for {first_project}: {project_embeddings[first_project]['embedding'][:5]} ...")


pinecone_api_key = os.getenv("PINECONE_API_KEY")

pc = Pinecone(api_key=pinecone_api_key)

index_name = "zendalona-projects"

# Note: The dimension should match the output of the embedding model (384 for all-MiniLM-L6-v2).
existing_indexes = pc.list_indexes().names()
if index_name not in existing_indexes:
    pc.create_index(
        name=index_name,
        dimension=len(next(iter(project_embeddings.values()))["embedding"]),
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )

index = pc.Index(index_name)

project_vectors = []
for title, info in project_embeddings.items():
    sanitized_id = sanitize_id(title)
    vector_item = {
        "id": sanitized_id, 
        "values": info["embedding"].tolist(),
        "metadata": {
            "title": title,
            "description": info["description"]
        }
    }
    project_vectors.append(vector_item)


# Upsert the project summary embeddings into Pinecone DB
index.upsert(vectors=project_vectors)
print("Project summary embeddings upserted successfully.")