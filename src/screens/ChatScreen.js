import React from 'react';
import { View, StyleSheet } from 'react-native';
import Chatbot from '../components/Chatbot';

const ChatScreen = () => {
  return (
    <View style={styles.container}>
      <Chatbot />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ChatScreen;