import SpeechInterface from '@/components/SpeechInterface';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Speech-to-Text & Text-to-Speech Demo
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Click the microphone button to start speaking, and use the speaker icon to hear the text read aloud.
        </p>
        <SpeechInterface />
      </div>
    </main>
  );
}
