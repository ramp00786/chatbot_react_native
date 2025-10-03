import * as Speech from 'expo-speech';
import { detectLangSmart } from './detectLangSmart';

// Improved language detection for speech
export const getLanguageForSpeech = async (text) => {
  try {
    const detectedLang = await detectLangSmart(text);
    
    // Map detected languages to speech API language codes
    switch (detectedLang) {
      case 'hindi':
      case 'translit-hindi':
        return 'hi-IN';
      case 'english':
      default:
        return 'en-US';
    }
  } catch (error) {
    console.error('Language detection failed:', error);
    return 'en-US'; // Default fallback
  }
};

// Speak text with automatic language detection
export const speakWithAutoLanguage = async (text, onDone = null) => {
  try {
    const speechLang = await getLanguageForSpeech(text);
    
    await Speech.speak(text, {
      language: speechLang,
      pitch: 1.0,
      rate: 0.9,
      onDone: onDone,
      onError: (error) => {
        console.error('Speech error:', error);
        if (onDone) onDone();
      }
    });
    
    return speechLang;
  } catch (error) {
    console.error('Speech with auto language failed:', error);
    if (onDone) onDone();
    throw error;
  }
};

// Stop current speech
export const stopSpeech = () => {
  Speech.stop();
};

// Streaming speech functionality
let streamingSpeechQueue = [];
let isStreamingSpeaking = false;
let streamingLanguage = 'en-US';
let streamingCallback = null;

export const startStreamingSpeech = (language = 'en-US', onComplete = null) => {
  streamingSpeechQueue = [];
  isStreamingSpeaking = true;
  streamingLanguage = language;
  streamingCallback = onComplete;
};

export const addTextToStreamingSpeech = (text, language = null) => {
  if (isStreamingSpeaking) {
    streamingSpeechQueue.push(text);
    if (language) {
      streamingLanguage = language;
    }
    processStreamingSpeechQueue();
  }
};

export const finishStreamingSpeech = (language = null) => {
  if (language) {
    streamingLanguage = language;
  }
  // Process any remaining text in queue
  processStreamingSpeechQueue();
  // Wait a bit then stop streaming
  setTimeout(() => {
    isStreamingSpeaking = false;
    if (streamingCallback) {
      streamingCallback();
      streamingCallback = null;
    }
  }, 500);
};

const processStreamingSpeechQueue = () => {
  if (streamingSpeechQueue.length > 0 && isStreamingSpeaking) {
    const textToSpeak = streamingSpeechQueue.join(' ');
    streamingSpeechQueue = [];
    
    Speech.speak(textToSpeak, {
      language: streamingLanguage,
      pitch: 1.0,
      rate: 0.9
    });
  }
};

// Simple transliteration function (placeholder - you may want to use a proper library)
export const transliterateToHindi = async (text) => {
  // This is a simplified transliteration - in production, use a proper library
  const hinglishToDevanagari = {
    'kya': 'क्या',
    'hai': 'है',
    'me': 'में',
    'aur': 'और',
    'ka': 'का',
    'ki': 'की',
    'ke': 'के',
    'se': 'से',
    'mausam': 'मौसम',
    'weather': 'मौसम',
    'aaj': 'आज',
    'kal': 'कल',
    'parso': 'परसों',
    // Add more mappings as needed
  };
  
  let transliterated = text.toLowerCase();
  
  for (const [english, hindi] of Object.entries(hinglishToDevanagari)) {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    transliterated = transliterated.replace(regex, hindi);
  }
  
  return transliterated;
};