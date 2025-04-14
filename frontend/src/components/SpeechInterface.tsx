"use client";
import { useState, useEffect, useRef } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { speakText, stopSpeaking, callChatbot } from "../utils/speechUtils";

const SpeechInterface: React.FC = () => {
  const [language, setLanguage] = useState<string>("en-US");
  const [chatbotResponse, setChatbotResponse] = useState<string>("");
  const [conversationHistory, setConversationHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  // Use a ref to always have the latest conversation history for API calls.
  const conversationHistoryRef = useRef(conversationHistory);
  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

  const {
    isListening,
    currentTranscript,
    error,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechRecognition(language);

  const handleStopListening = async () => {
    const transcript = await stopListening();
    if (transcript.trim()) {
      try {
        // Call the chatbot API with the current conversation history from the ref.
        const { reply, conversationHistory: updatedHistory } = await callChatbot(
          transcript,
          conversationHistoryRef.current
        );
        setConversationHistory(updatedHistory);
        setChatbotResponse(reply);
        // TTS.
        speakText(reply, language);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const clearConversation = () => {
    setConversationHistory([]);
    setChatbotResponse("");
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
          onClick={handleStopListening}
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
        <button
          onClick={stopSpeaking}
          style={{
            padding: "8px 16px",
            marginLeft: "10px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Stop Speech
        </button>
      </div>
      {isListening && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
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
          onClick={clearConversation}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ff5252",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Clear Conversation
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h2>Latest Chatbot Response:</h2>
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

      <div style={{ marginTop: "20px" }}>
        <h2>Conversation:</h2>
        {conversationHistory.map((msg, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "4px",
              backgroundColor: "#fff",
            }}
          >
            <strong>{msg.role === "user" ? "User" : "Assistant"}: </strong>
            <span>{msg.content}</span>
            <button
              onClick={() => speakText(msg.content, language)}
              style={{
                padding: "4px 8px",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginLeft: "10px",
              }}
            >
              🔊
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .blinking-dot {
          width: 12px;
          height: 12px;
          background-color: #ff5252;
          border-radius: 50%;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default SpeechInterface;
