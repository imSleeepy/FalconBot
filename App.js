import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Animated, PanResponder, Dimensions, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';  // Import axios for making HTTP requests

export default function App() {
  const [isVisible, setIsVisible] = useState(true);
  const [botMessage, setBotMessage] = useState('');
  const [userMessage, setUserMessage] = useState('');  // State for user input
  const [messages, setMessages] = useState([]);  // State for storing messages
  const translateY = useRef(new Animated.Value(0)).current;
  const bounceValue = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy < -10;
      },
      onPanResponderMove: Animated.event(
        [null, { dy: translateY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy < -100) {
          Animated.timing(translateY, {
            toValue: -Dimensions.get('window').height,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setIsVisible(false);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    translateY.setValue(0);

    // Bouncing animation
    Animated.loop(
      Animated.sequence([
        Animated.spring(bounceValue, {
          toValue: -10,
          friction: 1,
          useNativeDriver: true,
        }),
        Animated.spring(bounceValue, {
          toValue: 0,
          friction: 1,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleSend = async () => {
    if (userMessage.trim() === '') return;

    // Display the user's message
    setMessages([...messages, { text: userMessage, isUser: true }]);

    try {
      const response = await axios.post('http://192.168.1.9:5000/get_text', {
        message: userMessage,
      });
      setBotMessage(response.data.botResponse);

      // Display the bot's response
      setMessages([...messages, { text: userMessage, isUser: true }, { text: response.data.botResponse, isUser: false }]);

    } catch (error) {
      console.error("There was an error fetching the data:", error);
    }

    // Clear the input and dismiss the keyboard
    setUserMessage('');
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>FalconBot</Text>
      </View>

      {isVisible && (
        <Animated.View
          style={[styles.swipeUpContainer, { transform: [{ translateY }, { translateY: bounceValue }] }]}
          {...panResponder.panHandlers}
        >
          <Image 
            source={require('./assets/adamsonlogo.png')} 
            style={styles.image} 
          />
          <Text style={styles.title}>Adamson Student Manual</Text>
          <View style={styles.swipeInfo}>
            <Text style={styles.swipeText}>Swipe up</Text>
            <Ionicons name="arrow-up" size={24} color="gray" />
          </View>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            <View style={styles.content}>
              <View style={styles.messageContainerLeft}>
                  <Image source={require('./assets/adamsonlogo.png')} style={styles.chatImage} />
                  <View style={styles.botContainer}>
                    <Text style={styles.chatTextbot}>Hello Klasmeyt!</Text>
                  </View>
                </View>

                {messages.map((message, index) => (
                  <View
                    key={index}
                    style={message.isUser ? styles.messageContainerRight : styles.messageContainerLeft}
                  >
                    {!message.isUser && (
                      <Image source={require('./assets/adamsonlogo.png')} style={styles.chatImage} />
                    )}
                    <View style={message.isUser ? styles.userContainer : styles.botContainer}>
                      <Text style={message.isUser ? styles.chatTextuser : styles.chatTextbot}>
                        {message.text}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type here..."
            value={userMessage}
            onChangeText={setUserMessage}
          />
          <TouchableOpacity style={styles.iconContainer} onPress={handleSend}>
            <Ionicons name="send" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    zIndex: 0, // Ensure it is behind the swipeUpContainer
    alignItems: 'left',
  },
  headerText: {
    color: '#264577',
    fontSize: 20,
    fontWeight: 'bold',
  },
  swipeUpContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // Ensures it appears above other content
    paddingBottom: 50, // Space for the swipe info
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#264577', // Adamson Color
    textAlign: 'center',
  },
  swipeInfo: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeText: {
    color: 'gray',
    fontSize: 16,
    marginRight: 8,
  },
  keyboardAvoidingContainer: {
    justifyContent: 'flex-end', // Ensures input container stays at the bottom
  },
  content: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    justifyContent: 'flex-end', // Ensure chat messages are above the input container
  },
  messageContainerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  messageContainerRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  botContainer: {
    backgroundColor: '#729ada',
    borderRadius: 10,
    padding: 10,
    maxWidth: '80%',
  },
  userContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    maxWidth: '80%',
    borderColor: '#264577',  
    borderWidth: 1,       
  },
  chatImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  chatTextbot: {
    color: '#fff',
    fontSize: 16,
  },
  chatTextuser: {
    color: '#264577',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    padding: 10,
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 40,
  },
  iconContainer: {
    marginLeft: 10,
  },
});

