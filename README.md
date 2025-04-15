# 🎙️ Voice-Powered AI Assistant & RAG Support System

This repository demonstrates a voice-interactive AI assistant prototype built for the [Zendalona GSoC 2025 Project: AI-Powered Agent for Support & Accessibility](https://zendalona.com). The application is designed to help visually impaired users interact with an AI chatbot using voice input, while also integrating a Retrieval-Augmented Generation (RAG) backend that answers detailed questions related to the company's projects.

The assistant supports both conversational interactions through voice and text as well as document-based queries on the products developed by Zendalona.

---

## ✨ Features

### Voice-Powered Assistant
- 🎤 **Speech-to-Text (STT)**: Converts spoken input into text using the browser-native Web Speech API.
- 🔊 **Text-to-Speech (TTS)**: Delivers natural voice responses to users.
- 💬 **Editable Notes & Chat History**: Manage and review past interactions.
- 🌐 **Language Selection**: Supports multiple languages for both voice recognition and output.

### RAG Q&A Backend
- 🤖 **LLM-Powered Responses**: Uses LLaMA 3.1 (via Groq API) for natural language generation.
- 🔎 **Retrieval-Augmented Generation (RAG)**: Trained on Zendalona's product data to provide detailed, context-aware answers.
  - Each product is indexed independently using a FAISS vector store.
  - Dynamic document extraction and chunking to process all relevant product fields.
- ♿ **Accessibility-Oriented Design**: Focused on ensuring ease-of-use for users with visual impairments.

---

## 📺 Demo Video

Watch the demo on YouTube:  
🔗 [YouTube Demo Link](https://youtu.be/Bs_JBf9uYoU)

---

## 🛠️ Tech Stack

- **Frontend**: React (Next.js)  
- **STT & TTS**: Web Speech API (browser-native)  
- **Voice & Chat Integration**: Custom React components  
- **AI Integration**:  
  - Groq LLaMA 3.1 via streaming API  
  - Backend RAG solution built with LangChain Community libraries (FAISS, HuggingFaceEmbeddings, and document processing modules)
- **Backend (RAG)**: Python, Flask (for API testing), FAISS for local vector storage

---

## 📁 Repository Structure

```plaintext
.
├── backend-rag/           # Folder containing code for RAG Q&A backend.
│   ├── train/             # Scripts for processing project data & training FAISS indexes.
│   │   └── train_project.py
│   ├── query.py           # Script for querying a project-specific FAISS index.
│   └── main.py            # Flask API exposing endpoints for semantic search.
├── frontend/              # Frontend application built with React (Next.js)
├── projects/              # JSON files containing product data.
└── README.md              # This README file.
```

## 🔧 How It Works

1. **Voice-Powered Interaction:**  
   The frontend converts user speech into text and displays it in the chat.  
2. **Semantic Querying:**  
   When users ask product-specific questions, the text query is sent to the backend RAG API which loads the relevant FAISS index (built per product) and performs a similarity search.
3. **LLM Integration:**  
   The backend then extracts the most relevant document chunks and supplies them as context for generating an LLM-based response.
4. **Output:**  
   The final answer is sent back to the frontend to be displayed and optionally played via text-to-speech.
