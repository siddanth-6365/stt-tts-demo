# Speech-to-Text & Text-to-Speech Demo

A Next.js application that demonstrates real-time speech-to-text (STT) and text-to-speech (TTS) functionality using the Web Speech API.

## Features

- Real-time speech-to-text conversion
- Text-to-speech playback
- Multiple language support
- Edit and delete messages
- Clear all messages
- Modern and responsive UI

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd stt-tts-demo
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Speech-to-Text**:
   - Click the microphone button to start recording
   - Speak into your microphone
   - Your speech will be converted to text in real-time
   - Click the microphone button again to stop recording

2. **Text-to-Speech**:
   - Click the speaker icon next to any message to hear it read aloud
   - The text will be read in the selected language

3. **Language Selection**:
   - Use the dropdown menu to select your preferred language
   - The selected language will be used for both STT and TTS

4. **Message Management**:
   - Click the edit icon to modify a message
   - Click the trash icon to delete a message
   - Use the "Clear All" button to remove all messages

## Browser Support

This application uses the Web Speech API, which is supported in most modern browsers:
- Chrome (recommended)
- Edge
- Safari
- Firefox

## Technologies Used

- Next.js
- TypeScript
- Tailwind CSS
- Web Speech API
- React Icons

## License

MIT
