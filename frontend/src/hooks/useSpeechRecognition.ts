import { useState, useRef, useEffect } from "react";
import { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from "../types/speech";

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  currentTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => Promise<string>;
  clearTranscript: () => void;
}

export const useSpeechRecognition = (language: string): UseSpeechRecognitionReturn => {
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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

  const stopListening = async (): Promise<string> => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        const transcript = currentTranscript;
        setCurrentTranscript("");
        return transcript;
      } catch (err) {
        console.error("Error stopping speech recognition:", err);
        setError("Failed to stop speech recognition. Please try again.");
        return "";
      }
    }
    return "";
  };

  const clearTranscript = () => {
    setCurrentTranscript("");
  };

  return {
    isListening,
    currentTranscript,
    error,
    startListening,
    stopListening,
    clearTranscript,
  };
}; 