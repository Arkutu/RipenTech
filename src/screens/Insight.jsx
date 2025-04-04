import React, { useState, useRef, useEffect, Component } from 'react';
import { Camera, Calendar, PieChart, ShoppingCart, History, Settings, Home, Info, User, Bell, Search, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Custom error boundary component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-red-50 p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">Error: {this.state.error?.message || "Unknown error"}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Insight = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openaiInitialized, setOpenaiInitialized] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  
  // Safe access to user context
  let userContext = { user: null, userDetails: null, loading: false, logout: () => {} };
  try {
    const { useUser } = require('../context/UserContext');
    userContext = useUser() || userContext;
  } catch (err) {
    console.warn('UserContext not available:', err);
  }
  
  const { user, userDetails, loading: userLoading, logout } = userContext;
  
  // Initialize OpenAI client for demonstration purposes
  const [openai, setOpenai] = useState(null);
  
  useEffect(() => {
    // Simulate initialization for demo purpose
    setTimeout(() => {
      setOpenaiInitialized(true);
    }, 1000);
  }, []);

  // Hard-coded responses for common fruit questions
  const fruitResponses = {
    "avocado ripe": "You can tell if an avocado is ripe by gently pressing it with your palm (not fingers). A ripe avocado will yield slightly to pressure but not feel mushy. The color should be dark green to black, and if the small stem at the top comes off easily and shows green underneath, it's ready to eat. If it's too firm, leave it at room temperature for 1-2 days to ripen.",
    
    "store berries": "The best way to store berries is to keep them dry and unwashed until you're ready to eat them. First, inspect and remove any damaged berries. Line a container with paper towels, add the berries in a single layer, and refrigerate. For maximum freshness, wash them just before eating. To extend shelf life by several days, you can soak berries in a vinegar solution (1 part vinegar to 3 parts water) for a few minutes, rinse thoroughly, and dry completely before refrigerating.",
    
    "banana recipe": "Here's a simple banana bread recipe for overripe bananas:\n\nIngredients:\n- 3 very ripe bananas, mashed\n- 1/3 cup melted butter\n- 1 teaspoon baking soda\n- Pinch of salt\n- 3/4 cup sugar\n- 1 large egg, beaten\n- 1 teaspoon vanilla extract\n- 1 1/2 cups all-purpose flour\n\nDirections:\n1. Preheat oven to 350°F (175°C)\n2. Mix butter and mashed bananas in a bowl\n3. Mix in baking soda and salt\n4. Stir in sugar, beaten egg, and vanilla\n5. Mix in flour\n6. Pour into greased loaf pan\n7. Bake for 50-60 minutes\n8. Let cool before serving",
    
    "fruits in season": "Since it's April, fruits currently in season include:\n\n1. Strawberries - Peak season starting now\n2. Pineapples - Prime season in spring\n3. Mangoes - Coming into season\n4. Oranges - Late season but still available\n5. Apricots - Early varieties beginning\n6. Cherries - Early varieties in warmer regions\n7. Rhubarb - Prime spring season\n\nAvailability varies by region, but these are generally becoming more abundant and flavorful in April.",
    
    "default": "I'm here to help with your fruit questions! I can provide information about ripeness indicators, storage methods, nutritional benefits, and recipe ideas for various fruits. Please feel free to ask anything specific about your favorite fruits!"
  };

  // Function to find the best matching response
  const findBestResponse = (query) => {
    query = query.toLowerCase();
    
    // Check for specific question matches
    if (query.includes("avocado") && (query.includes("ripe") || query.includes("tell"))) {
      return fruitResponses["avocado ripe"];
    }
    
    if ((query.includes("berries") || query.includes("berry")) && 
        (query.includes("store") || query.includes("keep") || query.includes("fresh"))) {
      return fruitResponses["store berries"];
    }
    
    if (query.includes("banana") && 
        (query.includes("recipe") || query.includes("overripe") || query.includes("make"))) {
      return fruitResponses["banana recipe"];
    }
    
    if ((query.includes("season") || query.includes("seasonal")) && 
        (query.includes("fruit") || query.includes("now"))) {
      return fruitResponses["fruits in season"];
    }
    
    // For questions about specific fruits not covered above
    if (query.includes("apple")) {
      return "Apples should be firm and crisp. Store them in the refrigerator crisper drawer to maintain freshness. They'll last 4-6 weeks refrigerated. For the best flavor, let refrigerated apples warm to room temperature before eating.";
    }
    
    if (query.includes("banana")) {
      return "Bananas ripen best at room temperature. To slow ripening, you can refrigerate ripe bananas - the skin will turn black but the fruit inside will stay fresh longer. To speed up ripening, place bananas in a paper bag with an apple or ripe banana.";
    }
    
    if (query.includes("orange") || query.includes("citrus")) {
      return "Oranges and citrus fruits should feel heavy for their size and have firm, smooth skin. They can be stored at room temperature for about a week, or refrigerated for up to three weeks. For maximum juice, bring them to room temperature before squeezing.";
    }
    
    // Default response if no matches found
    return fruitResponses["default"];
  };

  // Call simulated chatbot API
  const callChatbotAPI = async (userMessage) => {
    setIsLoading(true);
    setError(null);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Return hardcoded response based on message content
      return findBestResponse(userMessage);
    } catch (error) {
      console.error('Error in simulated API call:', error);
      throw new Error('Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    
    if (inputMessage.trim() === '') return;
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user'
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    
    try {
      // Get bot response
      const botResponse = await callChatbotAPI(currentInput);
      
      // Add bot message to chat
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot'
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (err) {
      console.error('Failed to process message:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      
      // Add error message to chat for better UX
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble responding right now. Please try again later.",
        sender: 'bot'
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Handle logout function
  const handleLogout = async () => {
    try {
      // First close the dropdown menu
      setProfileDropdownOpen(false);
      
      // Show loading indicator
      setLocalLoading(true);
      
      // Simulate logout process
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Navigate to MainHome landing page
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to log out. Please try again.');
      // In case of error, stop loading indicator
      setLocalLoading(false);
    }
  };

  // Generate user initials for avatar
  const getUserInitials = () => {
    if (userDetails?.name) {
      const nameParts = userDetails.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return userDetails.name.substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2)?.toUpperCase() || 'RT';
  };

  // Get display name
  const getDisplayName = () => {
    return userDetails?.name || user?.email?.split('@')[0] || 'Fruit Enthusiast';
  };

  // Navigation functions
  const navigateToHome = () => {
    try {
      navigate('/dashboard');
    } catch (err) {
      console.error('Navigation error:', err);
      setError('Navigation failed. Please try again.');
    }
  };

  const navigateToScan = () => {
    try {
      navigate('/scan');
    } catch (err) {
      console.error('Navigation error:', err);
      setError('Navigation failed. Please try again.');
    }
  };

  // Handle suggested questions
  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
    // Using setTimeout to ensure state update before submitting
    setTimeout(() => {
      const event = { preventDefault: () => {} };
      handleSendMessage(event);
    }, 100);
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200">
        {/* Top Navigation Bar */}
        <header className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4 shadow-lg">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={navigateToHome}>
              {/* Enhanced Logo */}
              <div className="relative h-10 w-10 mr-1">
                <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg transform rotate-45"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                    <path d="M7,2C4,2 2,5 2,8C2,10.11 3,13 4,14C5,15 6,22 6,22H18C18,22 19,15 20,14C21,13 22,10.11 22,8C22,5 20,2 17,2C14,2 13,4 12,4C11,4 10,2 7,2Z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold tracking-wide">
                <span className="font-bold">RIPEN</span>
                <span className="font-normal"> TECH</span>
              </h1>
            </div>
            
            {/* Search bar */}
            <div className="hidden md:flex items-center bg-white bg-opacity-20 rounded-full px-4 py-2 w-1/3">
              <Search size={18} className="mr-2 text-green-100" />
              <input 
                type="text" 
                placeholder="Search insights, questions, tips..." 
                className="bg-transparent text-white placeholder-green-100 outline-none w-full"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="bg-white bg-opacity-20 rounded-full p-2 hover:bg-opacity-30 transition-all">
                <Bell size={20} />
              </button>
              <button className="bg-white bg-opacity-20 rounded-full p-2 hover:bg-opacity-30 transition-all">
                <Settings size={20} />
              </button>
              
              {/* Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-700 font-bold hover:ring-2 hover:ring-green-400 transition-all"
                >
                  {getUserInitials()}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-300 rounded-full border-2 border-green-700"></div>
                </button>
                
                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    
                    <div className="py-1">
                      <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 w-full text-left">
                        <User size={16} className="mr-3 text-gray-500" />
                        My Profile
                      </button>
                      <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 w-full text-left">
                        <Settings size={16} className="mr-3 text-gray-500" />
                        Settings
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut size={16} className="mr-3 text-red-500" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Error display if any */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-auto max-w-6xl w-full mt-2">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button 
                    onClick={() => setError(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content - Chat area */}
        <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-4 overflow-hidden">
          <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-5 mb-4 border-l-4 border-green-600">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Fruit Insights Assistant
                </h2>
                <p className="text-green-700 font-medium mt-1">Ask me anything about fruits, ripeness, and storage</p>
              </div>
              <div className="bg-green-50 px-3 py-1 rounded-full text-green-700 text-sm font-medium">
                AI Powered
              </div>
            </div>
          </div>
          
          {/* Chat area */}
          <div className="flex-1 overflow-y-auto bg-white bg-opacity-90 rounded-xl shadow-lg p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
                  <PieChart size={32} className="text-green-600" />
                </div>
                <p className="font-medium text-gray-700 mb-2">Welcome to Fruit Insights</p>
                <p className="text-gray-500 mb-4">Ask me about fruit ripeness, storage tips, nutritional info, or recipes!</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-md mx-auto">
                  <button 
                    onClick={() => handleSuggestedQuestion("How can I tell if an avocado is ripe?")}
                    className="text-left text-sm bg-green-50 p-2 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    "How can I tell if an avocado is ripe?"
                  </button>
                  <button 
                    onClick={() => handleSuggestedQuestion("What's the best way to store berries?")}
                    className="text-left text-sm bg-green-50 p-2 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    "What's the best way to store berries?"
                  </button>
                  <button 
                    onClick={() => handleSuggestedQuestion("Give me a recipe for overripe bananas")}
                    className="text-left text-sm bg-green-50 p-2 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    "Give me a recipe for overripe bananas"
                  </button>
                  <button 
                    onClick={() => handleSuggestedQuestion("Which fruits are in season now?")}
                    className="text-left text-sm bg-green-50 p-2 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    "Which fruits are in season now?"
                  </button>
                </div>
              </div>
            ) : (
              messages.map(message => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-2 ${
                      message.sender === 'user' 
                        ? 'bg-green-600 text-white rounded-br-none' 
                        : 'bg-green-50 text-gray-800 shadow-sm rounded-bl-none'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-green-50 shadow-sm rounded-lg px-4 py-2 rounded-bl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input area */}
          <form onSubmit={handleSendMessage} className="bg-white bg-opacity-90 rounded-xl shadow-lg mt-4 p-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Ask about fruits, ripeness, recipes..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-full p-2 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-shadow"
                disabled={isLoading || inputMessage.trim() === ''}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
        
        {/* Bottom Navigation Bar for Mobile */}
        <nav className="md:hidden bg-white border-t border-gray-200 px-4 py-3 flex justify-around shadow-lg">
          <button 
            onClick={navigateToHome}
            className="flex flex-col items-center text-gray-500"
          >
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button 
            onClick={navigateToScan}
            className="flex flex-col items-center text-gray-500"
          >
            <Camera size={20} />
            <span className="text-xs mt-1">Scan</span>
          </button>
          <button 
            className="flex flex-col items-center text-green-600"
          >
            <PieChart size={20} />
            <span className="text-xs mt-1">Insights</span>
          </button>
          <button 
            className="flex flex-col items-center text-gray-500"
          >
            <User size={20} />
            <span className="text-xs mt-1">Account</span>
          </button>
        </nav>

        {/* Global loading overlay */}
        {localLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-5 rounded-lg flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
              <p className="mt-3 text-gray-700">Loading...</p>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Insight;