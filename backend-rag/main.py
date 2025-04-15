from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

INDEXES_DIR = "./indexes"

# Preload the embedding model (using the updated package)
embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

def load_faiss_index(project_slug: str):
    """
    Load FAISS index from the local filesystem for a given project.
    The flag `allow_dangerous_deserialization=True` is set to allow loading pickle files.
    """
    index_path = os.path.join(INDEXES_DIR, project_slug)
    if not os.path.exists(index_path):
        raise FileNotFoundError(f"No index found for project: {project_slug}")
    
    index = FAISS.load_local(
        index_path,
        embeddings=embedding_model,
        allow_dangerous_deserialization=True
    )
    return index

@app.route("/query", methods=["POST"])
def query_project():
    try:
        data = request.get_json()
        project = data.get("project", "").strip()
        question = data.get("question", "").strip()

        if not project or not question:
            return jsonify({"error": "Both 'project' and 'question' fields are required."}), 400

        project = project.lower()

        index = load_faiss_index(project)
        results = index.similarity_search(question, k=5)

        response = []
        for match in results:
            response.append({
                "section": match.metadata.get("section", "unknown"),
                "content": match.page_content.strip()
            })

        return jsonify({
            "project": project,
            "question": question,
            "results": response
        })

    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
