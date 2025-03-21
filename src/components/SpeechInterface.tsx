"use client";
import { useState, useRef, useEffect, FormEvent } from "react";

interface Message {
  id: number;
  text: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResult {
  [index: number]: {
    transcript: string;
  };
  isFinal: boolean;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResult[];
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const Home: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("en-US");
  const [error, setError] = useState<string | null>(null);
  const [chatbotResponse, setChatbotResponse] = useState<string>("");

  // Ref for SpeechRecognition instance
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const initializeSpeechRecognition = () => {
      if (typeof window === "undefined") return;
      const SpeechRecognitionConstructor =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionConstructor) {
        setError(
          "Your browser does not support the Web Speech API. Please use Chrome or Edge."
        );
        return;
      }
      try {
        const recognition = new SpeechRecognitionConstructor();
        recognition.lang = language;
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = "";
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          setCurrentTranscript(finalTranscript || interimTranscript);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error);
          let errorMessage = "An error occurred with speech recognition.";
          switch (event.error) {
            case "network":
              errorMessage =
                "Network error: Please check your internet connection and try again.";
              break;
            case "no-speech":
              errorMessage = "No speech was detected. Please try again.";
              break;
            case "aborted":
              errorMessage = "Speech recognition was aborted.";
              break;
            case "audio-capture":
              errorMessage =
                "No microphone was found. Please check your microphone settings.";
              break;
            case "not-allowed":
              errorMessage =
                "Microphone access was denied. Please allow microphone access in your browser settings.";
              break;
            case "service-not-available":
              errorMessage =
                "Speech recognition service is not available. Please try again later.";
              break;
            case "bad-grammar":
              errorMessage = "Grammar error in speech recognition.";
              break;
            case "language-not-supported":
              errorMessage = "The selected language is not supported.";
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}`;
          }
          setError(errorMessage);
          setIsListening(false);
          setTimeout(() => setError(null), 5000);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.error("Error initializing speech recognition:", err);
        setError(
          "Failed to initialize speech recognition. Please try refreshing the page."
        );
      }
    };

    initializeSpeechRecognition();
  }, [language]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setError(null);
        setIsListening(true);
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error starting speech recognition:", err);
        setError("Failed to start speech recognition. Please try again.");
        setIsListening(false);
      }
    }
  };

  const stopListening = async () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        if (currentTranscript.trim()) {
          // Save the user's query as a message
          setMessages((prev) => [
            ...prev,
            { id: Date.now(), text: currentTranscript },
          ]);
          // Call the chatbot API with the transcript
          await callChatbot(currentTranscript);
        }
        setCurrentTranscript("");
      } catch (err) {
        console.error("Error stopping speech recognition:", err);
        setError("Failed to stop speech recognition. Please try again.");
      }
    }
  };

  const clearTranscript = () => {
    setCurrentTranscript("");
  };

  // Call the Groq chatbot API endpoint
  const callChatbot = async (query: string) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: query }),
      });
      const data = await response.json();
      if (response.ok) {
        setChatbotResponse(data.reply);
        // Speak the chatbot reply using TTS
        speakText(data.reply);
      } else {
        setError(data.error || "Error getting response from chatbot");
      }
    } catch (err) {
      console.error("Error calling chatbot API:", err);
      setError("Error calling chatbot API. Please try again.");
    }
  };

  const speakText = (text: string) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Error with TTS:", err);
      setError("Failed to play text-to-speech. Please try again.");
    }
  };

  const deleteMessage = (id: number) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const editMessage = (id: number, newText: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, text: newText } : msg))
    );
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
        color: "#333",
      }}
    >
      <h1>Accessible Chatbot Demo</h1>
      {error && (
        <div
          style={{
            padding: "10px",
            marginBottom: "20px",
            backgroundColor: "#ffebee",
            border: "1px solid #ffcdd2",
            borderRadius: "4px",
            color: "#c62828",
          }}
        >
          {error}
        </div>
      )}
      <div style={{ marginBottom: "10px" }}>
        <label htmlFor="language-select">Select Language: </label>
        <select
          id="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="en-US">English (US)</option>
          <option value="es-ES">Spanish (Spain)</option>
          <option value="fr-FR">French (France)</option>
          <option value="de-DE">German</option>
        </select>
      </div>
      <div style={{ marginBottom: "10px" }}>
        <button
          onClick={startListening}
          disabled={isListening}
          style={{
            padding: "8px 16px",
            marginRight: "10px",
            backgroundColor: isListening ? "#ff5252" : "#2196f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isListening ? "not-allowed" : "pointer",
          }}
        >
          {isListening ? "Listening..." : "Start Recording"}
        </button>
        <button
          onClick={stopListening}
          disabled={!isListening}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ff5252",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: !isListening ? "not-allowed" : "pointer",
          }}
        >
          Stop Recording
        </button>
        <button
          onClick={clearTranscript}
          style={{
            padding: "8px 16px",
            marginLeft: "10px",
            backgroundColor: "#9e9e9e",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Clear Transcript
        </button>
      </div>
      {/* Blinking Recording Indicator */}
      {isListening && (
        <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
          <div className="blinking-dot" style={{ marginRight: "8px" }}></div>
          <span>Recording...</span>
        </div>
      )}
      <div style={{ marginTop: "20px" }}>
        <h2>Transcript:</h2>
        <p
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            minHeight: "50px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
          }}
        >
          {currentTranscript}
        </p>
      </div>
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={clearMessages}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ff5252",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Clear All Notes
        </button>
      </div>
      <div style={{ marginTop: "20px" }}>
        <h2>Notes:</h2>
        {messages.map((msg) => (
          <Note
            key={msg.id}
            message={msg}
            onDelete={() => deleteMessage(msg.id)}
            onEdit={(newText: string) => editMessage(msg.id, newText)}
            onSpeak={() => speakText(msg.text)}
          />
        ))}
      </div>
      <div style={{ marginTop: "20px" }}>
        <h2>Chatbot Response:</h2>
        <p
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            minHeight: "50px",
            backgroundColor: "#e8f5e9",
            borderRadius: "4px",
          }}
        >
          {chatbotResponse}
        </p>
      </div>
      {/* Inline styles for blinking dot */}
      <style jsx>{`
        .blinking-dot {
          width: 12px;
          height: 12px;
          background-color: #ff5252;
          border-radius: 50%;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

interface NoteProps {
  message: Message;
  onDelete: () => void;
  onEdit: (newText: string) => void;
  onSpeak: () => void;
}

const Note: React.FC<NoteProps> = ({ message, onDelete, onEdit, onSpeak }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedText, setEditedText] = useState<string>(message.text);

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    onEdit(editedText);
    setIsEditing(false);
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "10px",
        marginBottom: "10px",
        borderRadius: "4px",
        backgroundColor: "#fff",
      }}
    >
      {isEditing ? (
        <form onSubmit={handleEditSubmit}>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            style={{
              width: "100%",
              height: "60px",
              padding: "8px",
              marginBottom: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <div>
            <button
              type="submit"
              style={{
                padding: "4px 8px",
                marginRight: "8px",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditedText(message.text);
              }}
              style={{
                padding: "4px 8px",
                backgroundColor: "#9e9e9e",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <p>{message.text}</p>
          <div>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: "4px 8px",
                marginRight: "8px",
                backgroundColor: "#2196f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              style={{
                padding: "4px 8px",
                marginRight: "8px",
                backgroundColor: "#ff5252",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
            <button
              onClick={onSpeak}
              style={{
                padding: "4px 8px",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🔊
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;