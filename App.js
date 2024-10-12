import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Animated, PanResponder, Dimensions, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import documentContent from './assets/document'; 

const apiKeys = [
  'AIzaSyCLfdfN3ZVwIznQ8Xd_d2Zl7FqY5rQF2Dk',  // jazcasing@gmail.com
  'AIzaSyA2YTaP7eoxQZGz4FZP1xs31sxTYwOM8lA',  // sparkyahjussi@gmail.com 
  'AIzaSyBYJ37ILiTYxFCi6KFOS6MQ0-Ym33aYhhA',  // iimsleeepy@gmail.com 
  'AIzaSyDquh6PNhwQ72d5jmjVbxwOf3NhfoMYxt0',  // ahjusstine@gmail.com 
  'AIzaSyAHPpQ8EiGCOnLedv7r-_6ggASFZs0BjMg',  // justingting55@gmail.com 
  'AIzaSyDpjbCUO39hxNHKZYb5sNRZpWO6HZDczQo',  // cryingmistaaaa@gmail.com 
];

let counter = 1;

const getCurrentAPIKey = () => {
  const currentKey = apiKeys[counter - 1];
  counter = counter >= apiKeys.length ? 1 : counter + 1;
  return currentKey;
};

export default function App() {
  const [isVisible, setIsVisible] = useState(true);
  const [userMessage, setUserMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [docContent, setDocContent] = useState(documentContent);
  const [isTyping, setIsTyping] = useState(false); 
  const [typingDots, setTypingDots] = useState(''); 
  const translateY = useRef(new Animated.Value(0)).current;
  const bounceValue = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const [inquiryTimestamps, setInquiryTimestamps] = useState([]);

  useEffect(() => {
    translateY.setValue(0);
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

  useEffect(() => {
    if (isTyping) {
      const intervalId = setInterval(() => {
        setTypingDots((prevDots) => (prevDots.length === 3 ? '' : prevDots + '.'));
      }, 500); 

      return () => clearInterval(intervalId); 
    }
  }, [isTyping]);

  const sendMessage = async (messageText) => {
    const rule = "From now on, always base your answers on the document that was sent to you. Remove all the '*' from your responses (Bold text). Paste your answer in plain text; if you use bullet points, use dashes '-'. If you want it in Bold, just paste it as plain text";
    const combinedMessage = `${docContent}\n\n${rule}\n\nUser: ${messageText}`;
  
    try {
      const apiKey = getCurrentAPIKey();  
      const genAI = new GoogleGenerativeAI(apiKey); 
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(combinedMessage);
      return result.response.text();
    } catch (error) {
      console.error('Error sending message:', error);
      return 'Sorry, something went wrong.';
    }
  };

  const handleSend = async () => {
    if (userMessage.trim() === '') return;
  
    const currentTime = Date.now();
  
    // Filter timestamps to only include those within the last minute (60,000 ms)
    const recentInquiries = inquiryTimestamps.filter(timestamp => currentTime - timestamp < 60000);
  
    if (recentInquiries.length >= 10) {
      const newBotMessage = { text: "Slow down with your inquiries klasmeyt", isUser: false };
      setMessages((prevMessages) => [...prevMessages, newBotMessage]);
      return;
    }
  
    // Add the current timestamp to the inquiryTimestamps
    setInquiryTimestamps([...recentInquiries, currentTime]);
  
    const newUserMessage = { text: userMessage, isUser: true };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setUserMessage('');
  
    setIsTyping(true);
  
    try {
      const botResponse = await sendMessage(userMessage);
      const newBotMessage = { text: botResponse, isUser: false };
      setMessages((prevMessages) => [...prevMessages, newBotMessage]);
    } catch (error) {
      console.error("There was an error fetching the data:", error);
    } finally {
      setIsTyping(false);
    }
  
    Keyboard.dismiss();
  
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  

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

      <ScrollView ref={scrollViewRef} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
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

              {isTyping && (
                <View style={styles.messageContainerLeft}>
                  <Image source={require('./assets/adamsonlogo.png')} style={styles.chatImage} />
                  <View style={styles.botContainer}>
                    <Text style={styles.typingText}>Typing{typingDots}</Text> 
                  </View>
                </View>
              )}

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
            style={[styles.textInput, isTyping && styles.disabledTextInput]}
            placeholder={isTyping ? "Please wait..." : "Type here..."}
            value={userMessage}
            onChangeText={setUserMessage}
            editable={!isTyping}  // Disable input when isTyping is true
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
    zIndex: 0, 
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
    zIndex: 1,
    paddingBottom: 50, 
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#264577',
    textAlign: 'center',
  },
  typingText: {
    color: '#f2f2f2',
    fontStyle: 'italic',
    fontSize: 16,
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
    justifyContent: 'flex-end', 
  },
  content: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    justifyContent: 'flex-end', 
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
  disabledTextInput: {
    backgroundColor: '#e0e0e0',  // Optional: change the color to indicate it's disabled
  },
  
});
