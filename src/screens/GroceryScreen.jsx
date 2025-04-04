import React, { useState, useEffect } from 'react';
import { ShoppingCart, Calendar, PieChart, Camera, Settings, Home, Info, User, Bell, Search, Loader, LogOut, CheckCircle, XCircle, AlertCircle, Upload, Trash2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore';

const GroceryScreen = () => {
  const { user, userDetails, loading: userLoading, error, logout } = useUser();
  const [localLoading, setLocalLoading] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [groceryItems, setGroceryItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  // API connection details
  const apiEndpoint = "https://1f63-34-16-205-97.ngrok-free.app/predict";

  // Load user data and grocery items
  useEffect(() => {
    if (!userLoading && user) {
      fetchGroceryItems();
    }
  }, [userLoading, user]);
  
  // Fetch grocery items from Firestore
  const fetchGroceryItems = async () => {
    try {
      setLocalLoading(true);
      const groceryRef = collection(db, 'groceryItems');
      const q = query(
        groceryRef, 
        where('userId', '==', user.uid),
        where('status', '==', 'Active'), 
        orderBy('addedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const items = [];
      
      querySnapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setGroceryItems(items);
      setLocalLoading(false);
    } catch (error) {
      console.error('Error fetching grocery items:', error);
      setLocalLoading(false);
    }
  };
  
  // Handle logout function
  const handleLogout = async () => {
    try {
      setProfileDropdownOpen(false);
      setLocalLoading(true);
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      setLocalLoading(false);
    }
  };
  
  // Navigation functions
  const navigateToDashboard = () => {
    navigate('/dashboard');
  };

  const navigateToScan = () => {
    // Navigate to the camera scanning page
    navigate('/scan');
  };
  
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

  // Function to get shelf life recommendation based on ripeness
  const getShelfLifeRecommendation = (fruit, ripeness) => {
    const recommendations = {
      "Apple": {
        "Ripe": "Optimal for consumption now. Can be stored in the refrigerator for up to 2 weeks.",
        "Unripe": "Will ripen in 3-5 days at room temperature. Place in a paper bag to speed up ripening."
      },
      "Banana": {
        "Ripe": "Best consumed within 1-2 days. Refrigerate to slow ripening or freeze for smoothies.",
        "Unripe": "Will ripen in 2-3 days at room temperature. Place near apples to speed up ripening."
      },
      "Dragon": {
        "Ripe": "Best consumed within 3-5 days. Can be refrigerated to extend shelf life.",
        "Unripe": "Will ripen in 4-7 days at room temperature."
      },
      "Grapes": {
        "Ripe": "Ready to eat. Can be refrigerated for up to 1-2 weeks.",
        "Unripe": "Should ripen within 1-2 days at room temperature."
      },
      "Lemon": {
        "Ripe": "Can be stored at room temperature for 1 week or refrigerated for up to 3 weeks.",
        "Unripe": "Will ripen in 3-5 days at room temperature."
      },
      "Mango": {
        "Ripe": "Best consumed within 2-3 days. Refrigerate to extend shelf life.",
        "Unripe": "Will ripen in 4-5 days at room temperature. Place in a paper bag to speed up ripening."
      },
      "Orange": {
        "Ripe": "Ready to eat. Can be stored at room temperature for up to 1 week or refrigerated for 2-3 weeks.",
        "Unripe": "Allow to ripen at room temperature for 1-3 days."
      },
      "Papaya": {
        "Ripe": "Consume within 1-2 days. Refrigerate to extend shelf life slightly.",
        "Unripe": "Will ripen in 3-5 days at room temperature."
      },
      "Pineapple": {
        "Ripe": "Consume within 2-3 days. Can be refrigerated for up to 5-7 days once cut.",
        "Unripe": "Will ripen in 1-2 days at room temperature. Cannot ripen further once harvested."
      },
      "Pomegranate": {
        "Ripe": "Can be stored at room temperature for up to 1 week or refrigerated for up to 2 months.",
        "Unripe": "Will ripen in 1-2 weeks at room temperature."
      },
      "Strawberry": {
        "Ripe": "Consume immediately or within 1-2 days. Refrigerate for best preservation.",
        "Unripe": "Will ripen in 1-2 days at room temperature, but flavor may not improve significantly."
      },
      "default": {
        "Ripe": "Ready for consumption. Store in appropriate conditions based on fruit type.",
        "Unripe": "Store at room temperature to continue ripening process."
      }
    };
    
    // Return recommendation or default if specific fruit not found
    return recommendations[fruit] ? recommendations[fruit][ripeness] : recommendations.default[ripeness];
  };
  
  // Function to handle image upload
  const handleImageUpload = async (event) => {
    if (!event.target.files || !event.target.files[0]) return;
    
    const imageFile = event.target.files[0];
    setUploadedImage(URL.createObjectURL(imageFile));
    setLocalLoading(true);
    
    try {
      // Create form data for API request
      const formData = new FormData();
      formData.append('file', imageFile);
      
      // Call the API
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('API response was not ok');
      }
      
      const data = await response.json();
      
      // Process API response
      const result = {
        fruit: data.fruit,
        ripeness: data.ripeness,
        confidenceFruit: data.confidence_fruit,
        confidenceRipeness: data.confidence_ripeness,
        image: data.image || URL.createObjectURL(imageFile),
        recommendation: getShelfLifeRecommendation(data.fruit, data.ripeness)
      };
      
      setScanResult(result);
      setShowScanModal(true);
      setLocalLoading(false);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setLocalLoading(false);
      // Show error notification
      alert('There was an error analyzing the image. Please try again.');
    }
  };
  
  // Add item to grocery list in Firestore
  const addToGroceryList = async (item) => {
    try {
      setIsSubmitting(true);
      
      // Create new document in Firestore
      const docRef = await addDoc(collection(db, 'groceryItems'), {
        userId: user.uid,
        fruit: item.fruit,
        ripeness: item.ripeness,
        confidenceFruit: item.confidenceFruit,
        confidenceRipeness: item.confidenceRipeness,
        image: item.image,
        recommendation: item.recommendation,
        addedAt: serverTimestamp(),
        consumedAt: null,
        status: 'Active'
      });
      
      // Add the new item to the local state with the Firestore ID
      setGroceryItems(prevItems => [{
        id: docRef.id,
        userId: user.uid,
        fruit: item.fruit,
        ripeness: item.ripeness,
        confidenceFruit: item.confidenceFruit,
        confidenceRipeness: item.confidenceRipeness,
        image: item.image,
        recommendation: item.recommendation,
        addedAt: new Date(),
        consumedAt: null,
        status: 'Active'
      }, ...prevItems]);
      
      setIsSubmitting(false);
      closeScanModal();
    } catch (error) {
      console.error('Error adding item to grocery list:', error);
      setIsSubmitting(false);
      alert('Failed to add item to your grocery list. Please try again.');
    }
  };
  
  // Mark item as consumed
  const markItemAsConsumed = async (itemId) => {
    try {
      setLocalLoading(true);
      
      // Update item in Firestore
      const itemRef = doc(db, 'groceryItems', itemId);
      await updateDoc(itemRef, {
        consumedAt: serverTimestamp(),
        status: 'Consumed'
      });
      
      // Update local state
      setGroceryItems(prevItems => 
        prevItems.filter(item => item.id !== itemId)
      );
      
      setLocalLoading(false);
    } catch (error) {
      console.error('Error marking item as consumed:', error);
      setLocalLoading(false);
      alert('Failed to update item. Please try again.');
    }
  };
  
  // Delete item from grocery list
  const deleteGroceryItem = async (itemId) => {
    try {
      setLocalLoading(true);
      
      // Delete item from Firestore
      await deleteDoc(doc(db, 'groceryItems', itemId));
      
      // Update local state
      setGroceryItems(prevItems => 
        prevItems.filter(item => item.id !== itemId)
      );
      
      setLocalLoading(false);
    } catch (error) {
      console.error('Error deleting grocery item:', error);
      setLocalLoading(false);
      alert('Failed to delete item. Please try again.');
    }
  };
  
  // Add manual item to grocery list
  const addManualItem = async () => {
    if (!newItemText.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Create new document in Firestore
      const docRef = await addDoc(collection(db, 'groceryItems'), {
        userId: user.uid,
        fruit: newItemText.trim(),
        ripeness: 'Unknown', // Default for manual entries
        confidenceFruit: 100,
        confidenceRipeness: 0,
        image: null,
        recommendation: "Manually added item. No ripeness information available.",
        addedAt: serverTimestamp(),
        consumedAt: null,
        status: 'Active'
      });
      
      // Add the new item to the local state
      setGroceryItems(prevItems => [{
        id: docRef.id,
        userId: user.uid,
        fruit: newItemText.trim(),
        ripeness: 'Unknown',
        confidenceFruit: 100,
        confidenceRipeness: 0,
        image: null,
        recommendation: "Manually added item. No ripeness information available.",
        addedAt: new Date(),
        consumedAt: null,
        status: 'Active'
      }, ...prevItems]);
      
      // Clear the input
      setNewItemText('');
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error adding manual item:', error);
      setIsSubmitting(false);
      alert('Failed to add item to your grocery list. Please try again.');
    }
  };
  
  // Close scan modal
  const closeScanModal = () => {
    setShowScanModal(false);
    setScanResult(null);
    setUploadedImage(null);
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

  // Loading state display
  if (userLoading || localLoading) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 items-center justify-center">
        <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="animate-spin mb-6 mx-auto">
            <Loader size={48} className="text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading your grocery data...</h2>
          <p className="text-gray-600">Preparing your personalized grocery list</p>
          <div className="mt-6 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-600 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state display
  if (error) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 items-center justify-center">
        <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="mx-auto mb-6 bg-red-100 rounded-full p-4 w-16 h-16 flex items-center justify-center">
            <Info size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200">
      {/* Top Navigation Bar */}
      <header className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center space-x-2">
            {/* Logo */}
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
              placeholder="Search for grocery items..." 
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

      {/* Main Content Area */}
      <main className="flex-grow overflow-auto p-4 md:p-6 max-w-6xl mx-auto w-full">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-5 border-l-4 border-green-600">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Smart Grocery Helper for {getDisplayName()}
                </h2>
                <p className="text-green-700 font-medium mt-1">AI-powered ripeness detection and shopping recommendations</p>
              </div>
              <div className="bg-green-50 px-3 py-1 rounded-full text-green-700 text-sm font-medium">
                AI Powered
              </div>
            </div>
            <p className="text-gray-600 mt-3 text-sm">Our advanced model identifies both fruit type and ripeness level from a single photo. Get personalized recommendations on when to consume your purchases for optimal freshness!</p>
          </div>
          
          {/* Ripeness Scanner Section */}
          <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-5">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Fruit Ripeness Scanner</h2>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
              <div className="flex items-start">
                <Info size={18} className="text-green-700 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-green-800 font-medium">Supported Fruits</p>
                  <p className="text-sm text-green-800 mt-1">
                    Our AI can detect: Apple, Banana, Dragon, Grapes, Lemon, Mango, Orange, Papaya, Pineapple, Pomegranate, and Strawberry
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {/* Scan Option */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center flex flex-col items-center h-full">
                <Camera size={52} className="text-green-600 mb-3" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Live Camera Scan</h3>
                <p className="text-gray-600 mb-4">Take a photo directly in the supermarket</p>
                <button
                  onClick={navigateToScan}
                  className="mt-auto w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-center"
                >
                  <Camera size={18} className="mr-2" />
                  Open Camera
                </button>
              </div>
              
              {/* Upload Option */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center flex flex-col items-center h-full">
                <Upload size={52} className="text-blue-600 mb-3" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Upload Photo</h3>
                <p className="text-gray-600 mb-4">Upload existing fruit images to analyze</p>
                <label
                  htmlFor="fruit-image-upload"
                  className="mt-auto w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-center cursor-pointer"
                >
                  <Upload size={18} className="mr-2" />
                  Choose Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="fruit-image-upload"
                />
              </div>
            </div>
          </div>
          
          {/* Grocery List Section */}
          <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Your Grocery List</h2>
              <div className="flex space-x-2">
                <button className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm hover:bg-green-200 transition-colors">
                  Edit List
                </button>
                <button className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm hover:bg-green-200 transition-colors">
                  Share List
                </button>
              </div>
            </div>
            
            {groceryItems.length > 0 ? (
              <div className="space-y-3">
                {groceryItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        item.ripeness === 'Ripe' ? 'bg-green-500' : 
                        item.ripeness === 'Unripe' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <h3 className="font-medium text-gray-800">{item.fruit}</h3>
                        <p className="text-sm text-gray-500">{item.ripeness}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {item.ripeness !== 'Unknown' && (
                        <span className={`px-3 py-1 rounded-full text-sm mr-4 ${
                          item.ripeness === 'Ripe' ? 'bg-green-50 text-green-700' : 
                          item.ripeness === 'Unripe' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700'
                        }`}>
                          Confidence: {Math.round(item.confidenceRipeness)}%
                        </span>
                      )}
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => markItemAsConsumed(item.id)}
                          className="p-1 text-gray-500 hover:text-green-600"
                          title="Mark as consumed"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button 
                          onClick={() => deleteGroceryItem(item.id)}
                          className="p-1 text-gray-500 hover:text-red-600"
                          title="Delete item"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-lg">
                <div className="mb-4 text-gray-400">
                  <ShoppingCart size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Your grocery list is empty</h3>
                <p className="text-gray-500 mb-4">Scan fruits to check ripeness and add them to your list</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={navigateToScan}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
                  >
                    Scan with Camera
                  </button>
                  <label
                    htmlFor="grocery-upload"
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors cursor-pointer"
                  >
                    Upload Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="grocery-upload"
                  />
                </div>
              </div>
            )}
            
            {/* Add Item Section */}
            <div className="mt-4 flex items-center border-t border-gray-100 pt-4">
              <input 
                type="text" 
                placeholder="Add an item to your list manually..." 
                className="flex-grow p-3 bg-green-50 rounded-lg outline-none focus:ring-2 focus:ring-green-300 transition-all"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addManualItem();
                  }
                }}
              />
              <button 
                className="ml-3 bg-gradient-to-r from-green-500 to-green-700 text-white p-3 rounded-lg hover:shadow-md transition-shadow disabled:opacity-50"
                onClick={addManualItem}
                disabled={isSubmitting || !newItemText.trim()}
              >
                {isSubmitting ? <Loader size={18} className="animate-spin" /> : 'Add Item'}
              </button>
            </div>
          </div>
          
          {/* Shelf Life Tips Section */}
<div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-5 mt-6">
  <h2 className="text-xl font-semibold text-gray-800 mb-4">Shelf Life Tips</h2>
  
  <div className="grid md:grid-cols-2 gap-4">
    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
      <h3 className="font-medium text-gray-800 mb-2 flex items-center">
        <CheckCircle size={18} className="text-green-600 mr-2" />
        Ripe Fruit Storage
      </h3>
      <p className="text-sm text-gray-600">
        Most ripe fruits should be consumed quickly or refrigerated to extend shelf life. 
        Bananas, apples, and citrus fruits can be kept at room temperature.
      </p>
    </div>
    
    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <h3 className="font-medium text-gray-800 mb-2 flex items-center">
        <AlertCircle size={18} className="text-yellow-600 mr-2" />
        Unripe Fruit Tips
      </h3>
      <p className="text-sm text-gray-600">
        Store unripe fruits at room temperature. To speed up ripening, place them in a paper 
        bag with an apple or banana, which release ethylene gas.
      </p>
    </div>
  </div>
  
  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
    <h3 className="font-medium text-gray-800 mb-2">Did you know?</h3>
    <p className="text-sm text-gray-600">
      The average household throws away approximately 30% of the food they purchase. 
      Using proper storage techniques and consuming fruits at optimal ripeness can 
      significantly reduce food waste and save money.
    </p>
  </div>
</div>
        {/* Bottom Navigation Bar for Mobile */}
<div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg">
  <div className="flex justify-around items-center p-3">
    <button 
      onClick={navigateToDashboard} 
      className="flex flex-col items-center"
    >
      <Home size={24} className="text-green-600" />
      <span className="text-xs mt-1">Home</span>
    </button>
    
    <button className="flex flex-col items-center">
      <ShoppingCart size={24} className="text-green-800" />
      <span className="text-xs mt-1 font-medium">Grocery</span>
    </button>
    
    <button 
      onClick={navigateToScan} 
      className="flex flex-col items-center bg-green-600 text-white p-2 rounded-full transform -translate-y-4"
    >
      <Camera size={28} />
    </button>
    
    <button className="flex flex-col items-center">
      <PieChart size={24} className="text-gray-600" />
      <span className="text-xs mt-1">Stats</span>
    </button>
    
    <button className="flex flex-col items-center">
      <Calendar size={24} className="text-gray-600" />
      <span className="text-xs mt-1">Planner</span>
    </button>
  </div>
</div>

{/* Scan Result Modal */}
{showScanModal && scanResult && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Scan Results</h2>
          <button 
            onClick={closeScanModal}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full"
          >
            <XCircle size={24} />
          </button>
        </div>
      </div>
      
      <div className="p-5">
        {uploadedImage && (
          <div className="mb-5 rounded-lg overflow-hidden">
            <img 
              src={uploadedImage} 
              alt="Uploaded fruit" 
              className="w-full h-48 object-cover" 
            />
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{scanResult.fruit}</h3>
              <p className={`text-sm font-medium ${
                scanResult.ripeness === 'Ripe' ? 'text-green-600' : 
                scanResult.ripeness === 'Unripe' ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {scanResult.ripeness}
              </p>
            </div>
            <div className="bg-green-50 px-3 py-1 h-fit rounded-full text-green-700 text-sm">
              {Math.round(scanResult.confidenceFruit)}% confident
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-1">Recommendation</h4>
            <p className="text-sm text-gray-600">{scanResult.recommendation}</p>
          </div>
          
          <div className="flex space-x-3 pt-3">
            <button 
              onClick={closeScanModal}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => addToGroceryList(scanResult)}
              disabled={isSubmitting}
              className="flex-1 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg hover:shadow-lg transition-shadow flex items-center justify-center"
            >
              {isSubmitting ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <>
                  <ShoppingCart size={18} className="mr-2" />
                  Add to List
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

</div>
</main>
</div>
);
};

export default GroceryScreen;