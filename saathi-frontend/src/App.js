import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef(null);

  // Backend URL - change this to your deployed backend URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize session
  const startSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      if (data.success) {
        setSessionId(data.sessionId);
        setShowWelcome(false);
        // Add welcome message
        setTimeout(() => {
          setMessages([{
            role: 'assistant',
            content: 'Hello! मैं Saathi हूं। I understand the pressures you face as an Indian student. Whether it\'s academic stress, family expectations, or just needing someone to talk to - I\'m here for you. What would you like to share today?',
            timestamp: new Date(),
            crisis: null
          }]);
        }, 1000);
      }
    } catch (err) {
      setError('Failed to start session. Please check if the backend server is running.');
    }
  };

  // Send message
  const sendMessage = async (message = inputMessage) => {
    if (!message.trim() || !sessionId || isLoading) return;

    const userMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = await response.json();
      
      if (data.success) {
        const aiMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          crisis: data.crisis || null
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err) {
      setError(err.message);
      const errorMessage = {
        role: 'assistant',
        content: 'I\'m sorry, I\'m having trouble connecting right now. Please try again in a moment. If you\'re in crisis, please contact: Vandrevala Foundation: +91-9999-666-555',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Quick message options
  const quickMessages = [
    { text: 'I am feeling stressed about exams', emoji: '📚', label: 'Exam Stress' },
    { text: 'Family pressure ho rahi hai', emoji: '👨‍👩‍👧‍👦', label: 'Family Pressure' },
    { text: 'I feel anxious about my future', emoji: '😰', label: 'Career Anxiety' },
    { text: 'Mood theek nahi hai aaj', emoji: '😔', label: 'Feeling Low' },
  ];

  // Handle enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Message component
  const Message = ({ message }) => {
    const isUser = message.role === 'user';
    
    return (
      <div className={`flex gap-2 sm:gap-3 mb-3 sm:mb-4 ${isUser ? 'justify-end' : 'justify-start'} px-2 sm:px-0`}>
        {!isUser && (
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
            S
          </div>
        )}
        
        <div className={`max-w-[75%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
          isUser 
            ? 'bg-blue-500 text-white rounded-br-md' 
            : message.isError 
              ? 'bg-red-100 text-red-800 border border-red-300 rounded-bl-md'
              : 'bg-gray-100 text-gray-800 rounded-bl-md'
        }`}>
          <div className="whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">
            {message.content}
          </div>
          
          {message.crisis && (
            <CrisisAlert crisis={message.crisis} />
          )}
          
          <div className="text-xs opacity-60 mt-1 sm:mt-2">
            {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
        
        {isUser && (
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
            Y
          </div>
        )}
      </div>
    );
  };

  // Crisis Alert component
  const CrisisAlert = ({ crisis }) => (
    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm">
      <h4 className="font-bold text-red-800 mb-2">🚨 Immediate Help:</h4>
      <div className="space-y-1 sm:space-y-2">
        {crisis.resources.slice(0, 2).map((resource, index) => (
          <div key={index} className="text-red-700">
            <strong className="text-xs sm:text-sm">{resource.name}:</strong> 
            <a href={`tel:${resource.phone}`} className="text-red-600 hover:underline ml-1 text-xs sm:text-sm block sm:inline">
              {resource.phone}
            </a>
          </div>
        ))}
      </div>
      <p className="text-red-800 mt-2 text-xs leading-tight">{crisis.message}</p>
    </div>
  );

  // Typing indicator
  const TypingIndicator = () => (
    <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4 px-2 sm:px-0">
      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
        S
      </div>
      <div className="bg-gray-100 px-3 sm:px-4 py-2 rounded-2xl rounded-bl-md">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-xs sm:text-sm">Saathi is typing</span>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold mb-1">🤝 Saathi</h1>
          <p className="text-blue-100 text-xs sm:text-sm">
            Your AI Mental Wellness Companion - Anonymous, Safe, Culturally Aware
          </p>
          {sessionId && (
            <div className="text-xs text-blue-200 mt-1">
              Session: {sessionId.slice(-8)}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full overflow-hidden">
        {/* Welcome Screen */}
        {showWelcome && (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
            <div className="text-center max-w-sm sm:max-w-md">
              <div className="text-4xl sm:text-6xl mb-4 sm:mb-6 animate-pulse">🌟</div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
                नमस्ते! Welcome to Saathi
              </h2>
              <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                Your anonymous, culturally-aware AI companion for mental wellness support. 
                I understand the unique pressures faced by Indian youth and can communicate 
                in both Hindi and English.
              </p>
              <div className="space-y-3">
                <button
                  onClick={startSession}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full font-medium transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto"
                >
                  Start Anonymous Chat
                </button>
                <p className="text-xs text-gray-500">
                  No registration required • Completely anonymous • Safe space
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        {sessionId && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4 messages">
              {messages.map((message, index) => (
                <Message key={index} message={message} />
              ))}
              
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t bg-white p-3 sm:p-4 shadow-lg">
              {/* Quick Options */}
              <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                {quickMessages.map((quick, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(quick.text)}
                    disabled={isLoading}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-sm">{quick.emoji}</span>
                    <span className="hidden sm:inline">{quick.label}</span>
                    <span className="sm:hidden text-xs">{quick.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex gap-2 sm:gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message... (Hindi/English)"
                  disabled={isLoading}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm sm:text-base"
                  maxLength={500}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px] sm:min-w-[80px] text-sm sm:text-base"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                    </div>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>

              {/* Character count */}
              <div className="text-xs text-gray-400 mt-1 sm:mt-2 text-right">
                {inputMessage.length}/500
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-xs sm:text-sm">
                  <strong>Connection Error:</strong> {error}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;