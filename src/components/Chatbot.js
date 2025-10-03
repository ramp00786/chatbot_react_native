import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';

import TodayWeatherCard from './TodayWeatherCard';
import HourlyWeatherCard from './HourlyWeatherCard';
import WeeklyWeatherCard from './WeeklyWeatherCard';

import { postQueryStreaming } from '../lib/apiClient';
import { 
  stopSpeech, 
  startStreamingSpeech, 
  addTextToStreamingSpeech, 
  finishStreamingSpeech, 
  speakWithAutoLanguage, 
  getLanguageForSpeech,
  transliterateToHindi 
} from '../lib/speechUtils';
import { detectLangSmart } from '../lib/detectLangSmart';
import { getRandomQuestions, getAllQuestionsWithCity } from '../lib/suggestedQuestions';

const { width, height } = Dimensions.get('window');

const Chatbot = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [queryLang, setQueryLang] = useState('en-US');
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [allQuestionsCache, setAllQuestionsCache] = useState(null); // Cache for all questions
  
  const scrollViewRef = useRef(null);

  // Initialize messages and speech recognition
  useEffect(() => {
    // Set initial welcome message
    setMessages([{
      text: "Namaste! Main MausamGPT hoon. Aaj ke mausam ke bare mein poocho!",
      sender: "bot",
      time: getCurrentTime(),
    }]);

    // Check speech recognition support
    checkSpeechSupport();
    
    // Load suggested questions with location
    loadSuggestedQuestions();
  }, []);

  const loadSuggestedQuestions = async (showAll = false) => {
    setLoadingQuestions(true);
    
    try {
      if (showAll) {
        // Use cache if available to avoid repeated location calls
        if (allQuestionsCache) {
          setCurrentQuestions(allQuestionsCache);
          setShowAllQuestions(true);
        } else {
          const allQuestions = await getAllQuestionsWithCity();
          setAllQuestionsCache(allQuestions); // Cache the result
          setCurrentQuestions(allQuestions);
          setShowAllQuestions(true);
        }
      } else {
        // For random questions, use cache if available for faster loading
        if (allQuestionsCache && allQuestionsCache.length > 0) {
          const shuffled = [...allQuestionsCache].sort(() => 0.5 - Math.random());
          setCurrentQuestions(shuffled.slice(0, 2));
        } else {
          const questions = await getRandomQuestions(2);
          setCurrentQuestions(questions);
        }
        setShowAllQuestions(false);
      }
    } catch (error) {
      console.error('Error loading suggested questions:', error);
      // Fallback questions without location
      setCurrentQuestions([
        { id: 1, text: "Aaj mausam kaisa hai?", icon: "sunny-outline" },
        { id: 2, text: "Kal barish hogi kya?", icon: "rainy-outline" }
      ]);
      setShowAllQuestions(false);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const checkSpeechSupport = async () => {
    // For now, we'll enable speech output only (TTS)
    // Voice input can be added later with a proper speech recognition service
    setSpeechSupported(true);
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const addUserMessage = (text, isAudio = false) => {
    const newMessage = {
      text,
      sender: 'user',
      time: getCurrentTime(),
      isAudio,
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  const addBotMessage = (text) => {
    const newMessage = {
      text,
      sender: 'bot',
      time: getCurrentTime(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  const processAndSendMessage = async (userMessage) => {
    setIsProcessing(true);

    try {
      let messageToSend = userMessage.text;
      let detectedLang = 'en-US';
      let isHindi = false;

      if (userMessage.isAudio) {
        detectedLang = await detectLangSmart(userMessage.text);
        isHindi = detectedLang === 'translit-hindi' || detectedLang === 'hindi';
        messageToSend = userMessage.text;
      }

      // Create a placeholder bot message for streaming
      const streamingMessageIndex = messages.length + 1;
      const streamingMessage = {
        text: '',
        sender: 'bot',
        time: getCurrentTime(),
        isStreaming: true
      };
      setMessages(prev => [...prev, streamingMessage]);

      // Start streaming speech if original was voice input
      let speechLang = 'en-US';
      if (userMessage.isAudio) {
        try {
          speechLang = await getLanguageForSpeech(userMessage.text);
          console.log(`Detected speech language: ${speechLang} for user input: ${userMessage.text}`);
          
          startStreamingSpeech(speechLang, () => {
            setIsSpeaking(false);
            setSpeakingMessageId(null);
          });
          setIsSpeaking(true);
          setSpeakingMessageId(streamingMessageIndex);
          setQueryLang(speechLang);
        } catch (error) {
          console.error('Language detection failed, using fallback:', error);
          speechLang = isHindi ? 'hi-IN' : 'en-US';
          startStreamingSpeech(speechLang, () => {
            setIsSpeaking(false);
            setSpeakingMessageId(null);
          });
          setIsSpeaking(true);
          setSpeakingMessageId(streamingMessageIndex);
          setQueryLang(speechLang);
        }
      }

      // Start streaming response
      let fullResponse = '';
      
      try {
        for await (const chunk of postQueryStreaming(messageToSend)) {
          fullResponse += chunk.token;
          
          // Add chunk to streaming speech if voice input
          if (userMessage.isAudio) {
            addTextToStreamingSpeech(chunk.token, speechLang);
          }
          
          // Update the streaming message with accumulated tokens
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.isStreaming) {
              lastMessage.text = fullResponse;
            }
            return newMessages;
          });
        }
        
        // Finish streaming speech
        if (userMessage.isAudio) {
          finishStreamingSpeech(speechLang);
        }
        
        // Mark streaming as complete
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.isStreaming) {
            lastMessage.isStreaming = false;
          }
          return newMessages;
        });
        
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        // Stop streaming speech if there was an error
        if (userMessage.isAudio) {
          stopSpeech();
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        }
        // Remove the streaming message and add error message
        setMessages(prev => prev.slice(0, -1));
        addBotMessage('Sorry, I encountered an error processing your request. Please try again.');
      }
      
    } catch (error) {
      console.error('Process message error:', error);
      addBotMessage('Sorry, I encountered an error processing your request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    const userMessage = message.trim();
    if (!userMessage) return;

    const newUserMessage = addUserMessage(userMessage);
    setMessage('');
    await processAndSendMessage(newUserMessage);
  };

  const startRecording = async () => {
    // For demo purposes, we'll simulate voice input
    // In production, integrate with a speech recognition service
    Alert.alert(
      'Voice Input Demo', 
      'This would normally record your voice. For demo, we\'ll use a sample question.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Try Sample',
          onPress: () => handleSpeechResult('आज पुणे में मौसम कैसा रहेगा? बारिश होगी या नहीं?')
        }
      ]
    );
  };

  const handleSpeechResult = async (transcript) => {
    // If user msg in hinglish than transliterate it into devnagiri for display
    let detectedLang = await detectLangSmart(transcript);     
    let displayMsg = transcript;
    
    if (detectedLang === 'translit-hindi') {
      // Only transliterate Hinglish to Devanagari for display
      displayMsg = await transliterateToHindi(transcript);
    }

    const newMessage = {
      text: displayMsg,
      sender: 'user',
      time: getCurrentTime(),
      isAudio: true,
    };
    setMessages((prev) => [...prev, newMessage]);
    
    // Send the original transcript (not translated) to the server
    await processAndSendMessage({
      text: transcript,  // Send original transcript as-is
      sender: 'user',
      time: getCurrentTime(),
      isAudio: true,
    });
  };

  const speakMessage = async (text, messageId = null) => {
    setIsSpeaking(true);
    setSpeakingMessageId(messageId);
    
    try {
      const detectedLang = await speakWithAutoLanguage(text, () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      });
      
      setQueryLang(detectedLang);
    } catch (error) {
      console.error('Speech failed:', error);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  const handleExampleQuestion = (question) => {
    setMessage(question);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#2563eb', '#1d4ed8']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Ionicons name="partly-sunny" size={24} color="white" />
            </View>
            <View>
              <Text style={styles.headerTitle}>MausamGPT</Text>
              <Text style={styles.headerSubtitle}>Weather Assistant</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Chat Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Weather Cards */}
        <View style={styles.weatherCardsContainer}>
          <TodayWeatherCard />
          <HourlyWeatherCard />
          <WeeklyWeatherCard />
        </View>

        {/* Messages */}
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageContainer,
              msg.sender === 'user' ? styles.userMessageContainer : styles.botMessageContainer
            ]}
          >
            {msg.sender === 'bot' && (
              <View style={styles.botAvatar}>
                <Ionicons name="partly-sunny" size={16} color="#3b82f6" />
              </View>
            )}
            
            <View
              style={[
                styles.messageBubble,
                msg.sender === 'user' ? styles.userBubble : styles.botBubble
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  msg.sender === 'user' ? styles.userText : styles.botText
                ]}
              >
                {msg.text}
                {msg.sender === 'user' && msg.isAudio && (
                  <Text style={styles.voiceIndicator}> (Voice)</Text>
                )}
                {msg.sender === 'bot' && msg.isStreaming && (
                  <Text style={styles.streamingIndicator}> ●●●●</Text>
                )}
              </Text>
              
              <View style={styles.messageFooter}>
                <Text
                  style={[
                    styles.timeText,
                    msg.sender === 'user' ? styles.userTimeText : styles.botTimeText
                  ]}
                >
                  {msg.time}
                </Text>
                
                {msg.sender === 'bot' && (
                  <View style={styles.messageActions}>
                    <TouchableOpacity
                      onPress={() => speakMessage(msg.text, index)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="volume-high-outline" size={14} color="#6b7280" />
                    </TouchableOpacity>
                    
                    {isSpeaking && speakingMessageId === index && (
                      <TouchableOpacity
                        onPress={() => {
                          stopSpeech();
                          setIsSpeaking(false);
                          setSpeakingMessageId(null);
                        }}
                        style={styles.actionButton}
                      >
                        <Ionicons name="stop-outline" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="document-text-outline" size={14} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            
            {msg.sender === 'user' && (
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={16} color="#3b82f6" />
              </View>
            )}
          </View>
        ))}

        {/* Example Questions */}
        <View style={styles.exampleQuestionsContainer}>
          <View style={styles.exampleQuestionsBubble}>
            <Text style={styles.exampleTitle}>Try asking:</Text>
            {currentQuestions.map((question, index) => (
              <TouchableOpacity
                key={question.id}
                style={styles.exampleButton}
                onPress={() => handleExampleQuestion(question.text)}
              >
                <Ionicons name={question.icon} size={16} color="#3b82f6" />
                <Text style={styles.exampleButtonText}>{question.text}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.exampleButton, styles.refreshButton, loadingQuestions && styles.loadingButton]}
              onPress={() => {
                if (!loadingQuestions) {
                  if (showAllQuestions) {
                    loadSuggestedQuestions(false); // Show random questions
                  } else {
                    loadSuggestedQuestions(true); // Show all questions
                  }
                }
              }}
              disabled={loadingQuestions}
            >
              <Ionicons 
                name={loadingQuestions ? "hourglass-outline" : (showAllQuestions ? "contract-outline" : "expand-outline")} 
                size={16} 
                color={loadingQuestions ? "#9ca3af" : "#6b7280"}
                style={loadingQuestions ? styles.spinningIcon : null}
              />
              <Text style={[styles.exampleButtonText, { color: loadingQuestions ? '#9ca3af' : '#6b7280' }]}>
                {loadingQuestions ? 'Loading...' : (showAllQuestions ? 'Show less' : 'More questions')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <View style={styles.textInputContainer}>
            <TouchableOpacity
              style={styles.micButton}
              onPress={startRecording}
              disabled={isProcessing || isRecording}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={20}
                color={isRecording ? '#ef4444' : '#6b7280'}
              />
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              placeholder="Ask about weather..."
              placeholderTextColor="#9ca3af"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              editable={!isProcessing}
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!message.trim() || isProcessing) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!message.trim() || isProcessing}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputFooter}>
            <View style={styles.fontSizeButtons}>
              <TouchableOpacity style={styles.fontButton}>
                <Text style={styles.fontButtonText}>A</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.fontButton, styles.fontButtonActive]}>
                <Text style={[styles.fontButtonText, styles.fontButtonActiveText]}>A+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helpText}>
              <Ionicons name="return-down-back" size={12} color="#6b7280" />
              {' '}Enter to send
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 140 : 120, // Extra space for input area + safe area
  },
  weatherCardsContainer: {
    marginBottom: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 12,
  },
  userBubble: {
    backgroundColor: '#3b82f6',
  },
  botBubble: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#374151',
  },
  voiceIndicator: {
    fontSize: 12,
    opacity: 0.7,
  },
  streamingIndicator: {
    fontSize: 12,
    opacity: 0.7,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
  },
  userTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  botTimeText: {
    color: '#6b7280',
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  exampleQuestionsContainer: {
    alignItems: 'flex-start',
    marginTop: 16,
  },
  exampleQuestionsBubble: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 12,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginRight: 16, // Add right margin to prevent touching the edge
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  exampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  exampleButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    marginLeft: 8,
    marginRight: 4,
  },
  refreshButton: {
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  loadingButton: {
    opacity: 0.7,
  },
  spinningIcon: {
    // Note: For actual rotation animation, you'd need to use Animated API
    // This is a simple visual indication for now
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: Platform.OS === 'ios' ? 40 : 60, // Safe area for mobile home indicator/buttons
   
  },
  inputWrapper: {
    padding: 8,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    
  },
  micButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
    color: '#111827',
    
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    padding: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  fontSizeButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  fontButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  fontButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  fontButtonText: {
    fontSize: 12,
    color: '#6b7280',
  },
  fontButtonActiveText: {
    color: '#1e40af',
  },
  helpText: {
    fontSize: 11,
    color: '#6b7280',
  },
});

export default Chatbot;