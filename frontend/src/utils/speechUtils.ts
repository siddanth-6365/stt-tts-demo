export const speakText = (text: string, language: string): void => {
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Error with TTS:", err);
    throw new Error("Failed to play text-to-speech. Please try again.");
  }
};

export const stopSpeaking = (): void => {
  try {
    window.speechSynthesis.cancel();
  } catch (err) {
    console.error("Error stopping TTS:", err);
    throw new Error("Failed to stop text-to-speech. Please try again.");
  }
};

export const callChatbot = async (
  query: string,
  conversationHistory: any[]
): Promise<any> => {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: query, conversationHistory }),
    });
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.error || "Error getting response from chatbot");
    }
  } catch (err) {
    console.error("Error calling chatbot API:", err);
    throw new Error("Error calling chatbot API. Please try again.");
  }
};
