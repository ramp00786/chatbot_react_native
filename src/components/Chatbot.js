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
  SafeAreaView,
  Keyboard,
  Animated,
  StatusBar,
} from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { SafeAreaProvider, SafeAreaView as SafeAreaContextView } from 'react-native-safe-area-context';

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

// Animated Processing Dots Component
const AnimatedProcessingDots = ({ fontSize = 12 }) => {
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;
  const dot4Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDots = () => {
      const duration = 600;
      
      Animated.sequence([
        Animated.timing(dot1Opacity, {
          toValue: 1,
          duration: duration / 4,
          useNativeDriver: true,
        }),
        Animated.timing(dot2Opacity, {
          toValue: 1,
          duration: duration / 4,
          useNativeDriver: true,
        }),
        Animated.timing(dot3Opacity, {
          toValue: 1,
          duration: duration / 4,
          useNativeDriver: true,
        }),
        Animated.timing(dot4Opacity, {
          toValue: 1,
          duration: duration / 4,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(dot1Opacity, {
            toValue: 0.3,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 0.3,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 0.3,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(dot4Opacity, {
            toValue: 0.3,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        animateDots(); // Loop the animation
      });
    };

    animateDots();
  }, [dot1Opacity, dot2Opacity, dot3Opacity, dot4Opacity]);

  return (
    <View style={styles.processingDotsContainer}>
      <Animated.Text style={[styles.processingDot, { opacity: dot1Opacity, fontSize }]}>●</Animated.Text>
      <Animated.Text style={[styles.processingDot, { opacity: dot2Opacity, fontSize }]}>●</Animated.Text>
      <Animated.Text style={[styles.processingDot, { opacity: dot3Opacity, fontSize }]}>●</Animated.Text>
      <Animated.Text style={[styles.processingDot, { opacity: dot4Opacity, fontSize }]}>●</Animated.Text>
    </View>
  );
};

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
  const [recording, setRecording] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [hasKeyboardBeenShown, setHasKeyboardBeenShown] = useState(false);
  const [fontSize, setFontSize] = useState('normal'); // 'small', 'normal', 'large'
  const [showTryAsking, setShowTryAsking] = useState(true); // Show/hide Try asking section
  
  const scrollViewRef = useRef(null);
  const messageSound = useRef(null);
  
  // SafeAreaView will handle all safe areas automatically

  // Get dynamic font size based on current setting
  const getFontSize = (baseSize) => {
    switch (fontSize) {
      case 'small':
        return Math.round(baseSize * 0.9);
      case 'large':
        return Math.round(baseSize * 1.2);
      case 'normal':
      default:
        return baseSize;
    }
  };

  // Handle font size change
  const handleFontSizeChange = (size) => {
    setFontSize(size);
  };

  // Play message sound
  const playMessageSound = async () => {
    try {
      if (messageSound.current) {
        await messageSound.current.unloadAsync();
      }
      
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/2.mp3'),
        { shouldPlay: true, volume: 0.5 }
      );
      
      messageSound.current = sound;
      
      // Clean up after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing message sound:', error);
    }
  };

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
    
    // Add keyboard event listeners
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setHasKeyboardBeenShown(true);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      // Keep hasKeyboardBeenShown as true to maintain consistent layout
    });
    
    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
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
    try {
      // Request microphone permissions
      const { status } = await Audio.requestPermissionsAsync();
      setSpeechSupported(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable microphone permission to use voice input feature.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking speech support:', error);
      setSpeechSupported(false);
    }
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
            // Play receive message sound when bot response is complete
            if (!userMessage.isAudio) {
              playMessageSound();
            }
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

    // Play send message sound
    playMessageSound();

    const newUserMessage = addUserMessage(userMessage);
    setMessage('');
    
    // Auto collapse suggested questions when user sends a message
    if (showAllQuestions) {
      loadSuggestedQuestions(false); // Show less questions
    }
    
    // Hide Try asking section when user sends message
    setShowTryAsking(false);
    
    await processAndSendMessage(newUserMessage);
  };

  const startRecording = async () => {
    if (!speechSupported) {
      Alert.alert(
        'Permission Required',
        'Please enable microphone permission to use voice input.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (recordingStatus === 'recording') {
      await stopRecording();
      return;
    }

    try {
      setIsRecording(true);
      setRecordingStatus('recording');

      // Configure audio recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(recordingOptions);
      await newRecording.startAsync();
      
      setRecording(newRecording);
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      setRecordingStatus('idle');
      Alert.alert(
        'Recording Error',
        'Failed to start recording. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setRecordingStatus('processing');
      console.log('Stopping recording...');
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      console.log('Recording stopped and stored at:', uri);
      
      // For now, we'll simulate speech-to-text conversion
      // In production, you would send the audio file to a speech recognition service
      await processAudioFile(uri);
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert(
        'Recording Error',
        'Failed to process recording. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRecording(false);
      setRecordingStatus('idle');
    }
  };

  const processAudioFile = async (audioUri) => {
    try {
      // TODO: Replace this simulation with actual speech-to-text processing
      // In production, you would:
      // 1. Send the audio file to a speech recognition service like Google Cloud Speech-to-Text
      // 2. Or use a service like Azure Cognitive Services Speech-to-Text
      // 3. Or integrate with OpenAI Whisper API
      // 4. Or use AWS Transcribe
      // 
      // Example implementation with OpenAI Whisper:
      // const formData = new FormData();
      // formData.append('file', {
      //   uri: audioUri,
      //   type: 'audio/m4a',
      //   name: 'recording.m4a',
      // });
      // formData.append('model', 'whisper-1');
      // 
      // const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': 'Bearer YOUR_OPENAI_API_KEY',
      //     'Content-Type': 'multipart/form-data',
      //   },
      //   body: formData,
      // });
      // 
      // const result = await response.json();
      // const transcript = result.text;
      
      // For demo purposes, showing different sample questions based on random selection
      const sampleQuestions = [
        'आज मुंबई में मौसम कैसा है?',
        'कल बारिश होगी क्या?',
        'इस हफ्ते तापमान कैसा रहेगा?',
        'आज पुणे में मौसम कैसा रहेगा?',
        'दिल्ली में आज धूप निकलेगी?'
      ];
      
      const randomQuestion = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
      
      // Show processing indicator
      const processingMessage = addBotMessage('🎤 Processing your voice...');
      
      // Simulate processing delay
      setTimeout(async () => {
        // Remove processing message
        setMessages(prev => prev.filter(msg => msg !== processingMessage));
        
        // Process the recognized text
        await handleSpeechResult(randomQuestion);
      }, 1500);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      Alert.alert(
        'Processing Error',
        'Failed to process audio. Please try again.',
        [{ text: 'OK' }]
      );
    }
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
    
    // Auto collapse suggested questions when user selects an example
    if (showAllQuestions) {
      loadSuggestedQuestions(false); // Show less questions
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set StatusBar on component mount
  useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#1d4ed8', true);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaContextView style={styles.container} edges={['bottom', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#1d4ed8" translucent={false} />
        
        <View style={styles.appContent}>
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
          <View style={styles.fontSizeButtonsHeader}>
            <TouchableOpacity 
              style={[styles.fontButtonHeader, fontSize === 'small' && styles.fontButtonHeaderActive]}
              onPress={() => handleFontSizeChange('small')}
            >
              <Text style={[styles.fontButtonHeaderText, fontSize === 'small' && styles.fontButtonHeaderActiveText]}>A</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.fontButtonHeader, fontSize === 'normal' && styles.fontButtonHeaderActive]}
              onPress={() => handleFontSizeChange('normal')}
            >
              <Text style={[styles.fontButtonHeaderText, fontSize === 'normal' && styles.fontButtonHeaderActiveText]}>AA</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.fontButtonHeader, fontSize === 'large' && styles.fontButtonHeaderActive]}
              onPress={() => handleFontSizeChange('large')}
            >
              <Text style={[styles.fontButtonHeaderText, fontSize === 'large' && styles.fontButtonHeaderActiveText]}>A+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
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
                  msg.sender === 'user' ? styles.userText : styles.botText,
                  { fontSize: getFontSize(14) }
                ]}
              >
                {msg.text}
                {msg.sender === 'user' && msg.isAudio && (
                  <Text style={styles.voiceIndicator}> (Voice)</Text>
                )}
                {msg.sender === 'bot' && msg.isStreaming && (
                  <AnimatedProcessingDots fontSize={getFontSize(12)} />
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
            <TouchableOpacity onPress={() => setShowTryAsking(!showTryAsking)} style={styles.titleContainer}>
              <Ionicons name="bulb-outline" size={18} color={showTryAsking ? "#f59e0b" : "#6b7280"} />
            </TouchableOpacity>
            
            {showTryAsking && (
              <>
                {currentQuestions.map((question, index) => (
                  <TouchableOpacity
                    key={question.id}
                    style={styles.exampleButton}
                    onPress={() => handleExampleQuestion(question.text)}
                  >
                    <Ionicons name={question.icon} size={16} color="#3b82f6" />
                    <Text style={[styles.exampleButtonText, { fontSize: getFontSize(14) }]}>{question.text}</Text>
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
              <Text style={[styles.exampleButtonText, { color: loadingQuestions ? '#9ca3af' : '#6b7280', fontSize: getFontSize(14) }]}>
                {loadingQuestions ? 'Loading...' : (showAllQuestions ? 'Show less' : 'More questions')}
              </Text>
            </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <View style={styles.textInputContainer}>
            <TouchableOpacity
              style={[
                styles.micButton,
                isRecording && styles.micButtonRecording,
                recordingStatus === 'processing' && styles.micButtonProcessing
              ]}
              onPress={startRecording}
              disabled={isProcessing || recordingStatus === 'processing'}
            >
              <Ionicons
                name={
                  recordingStatus === 'processing' ? 'hourglass-outline' :
                  isRecording ? 'stop' : 'mic'
                }
                size={24}
                color={
                  recordingStatus === 'processing' ? '#f59e0b' :
                  isRecording ? '#ef4444' : '#6b7280'
                }
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
              <Ionicons name="send" size={24} color="white" />
            </TouchableOpacity>
          </View>
          

          </View>
        </View>
        </KeyboardAvoidingView>
        </View>
      </SafeAreaContextView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6', // Same as app background
  },
  appContent: {
    flex: 1,
    backgroundColor: '#f3f4f6', // App background starts from header
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 50,
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
  fontSizeButtonsHeader: {
    flexDirection: 'row',
    gap: 6,
  },
  fontButtonHeader: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  fontButtonHeaderActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  fontButtonHeaderText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  fontButtonHeaderActiveText: {
    color: 'white',
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 12,
    paddingBottom: 20,
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
  processingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  processingDot: {
    color: '#6b7280',
    marginHorizontal: 1,
    fontWeight: 'bold',
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginLeft: 6,
    textDecorationLine: 'underline',
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
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 0, // Minimal padding for better spacing
    marginBottom: 20,
  },
  inputWrapper: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  micButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
  },
  micButtonRecording: {
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  micButtonProcessing: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    color: '#111827',
    minHeight: 48,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 24,
    padding: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },

});

export default Chatbot;