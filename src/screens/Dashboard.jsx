import React, { useState, useEffect } from 'react';
import { Camera, Calendar, PieChart, ShoppingCart, History, Settings, Home, Info, User, Bell, Search, Loader, LogOut } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Make sure to import your Firebase db

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, userDetails, loading: userLoading, error, logout } = useUser();
  const [localLoading, setLocalLoading] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  
  // State for fruit scan data
  const [recentScans, setRecentScans] = useState([]);
  const [detectedFruits, setDetectedFruits] = useState([]);
  const [scanLoading, setScanLoading] = useState(true);
  const [scanError, setScanError] = useState(null);
  
  // Fetch user's scan data from Firestore
  useEffect(() => {
    const fetchScanData = async () => {
      if (!user?.uid) return;
      
      try {
        setScanLoading(true);
        
        // Query for recent scans
        const scansRef = collection(db, 'fruitScans');
        const q = query(
          scansRef,
          where('userId', '==', user.uid),
          orderBy('scannedAt', 'desc'),
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        
        // Process scan data
        const scans = [];
        const uniqueFruits = new Map();
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Add to recent scans
          const scan = {
            id: doc.id,
            date: data.scannedAt.toDate().toLocaleDateString(),
            location: data.location || 'Unknown',
            fruits: [data.fruit], // Will group by scan date later
            scanId: data.scanId,
            imageUrl: data.imageUrl
          };
          
          // Check if we already have a scan with this date and similar timestamp
          const existingScanIndex = scans.findIndex(
            (s) => s.date === scan.date && s.scanId === scan.scanId
          );
          
          if (existingScanIndex >= 0) {
            // Add fruit to existing scan if not already there
            if (!scans[existingScanIndex].fruits.includes(data.fruit)) {
              scans[existingScanIndex].fruits.push(data.fruit);
            }
          } else {
            scans.push(scan);
          }
          
          // Process unique fruits for the "Recently Detected Fruits" section
          if (!uniqueFruits.has(data.fruit)) {
            const daysToRipe = getDaysToRipe(data.ripeness);
            uniqueFruits.set(data.fruit, {
              name: data.fruit,
              variety: data.variety || 'Unknown',
              ripeness: data.confidence || 75, // Use confidence as ripeness percentage
              daysToRipe: daysToRipe,
              image: data.imageUrl || '/api/placeholder/80/80'
            });
          }
        });
        
        setRecentScans(scans);
        setDetectedFruits(Array.from(uniqueFruits.values()).slice(0, 3)); // Get top 3 fruits
        setScanLoading(false);
      } catch (err) {
        console.error('Error fetching scan data:', err);
        setScanError(err.message);
        setScanLoading(false);
      }
    };
    
    fetchScanData();
  }, [user?.uid]);
  
  // Helper function to calculate days to ripe based on ripeness string
  const getDaysToRipe = (ripeness) => {
    switch (ripeness?.toLowerCase()) {
      case 'ripe':
        return 0;
      case 'overripe':
        return -1; // Already past peak
      case 'underripe':
        return 3;
      case 'nearly ripe':
        return 1;
      default:
        return 2; // Default days if ripeness is unknown
    }
  };
  
  // Simulate loading for dashboard content
  useEffect(() => {
    if (!userLoading && !scanLoading) {
      // Add a short delay to show loading animation
      const timer = setTimeout(() => {
        setLocalLoading(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [userLoading, scanLoading]);
  
  // Handle logout function
  const handleLogout = async () => {
    try {
      // First close the dropdown menu
      setProfileDropdownOpen(false);
      
      // Show loading indicator
      setLocalLoading(true);
      
      // Call the logout function from context
      await logout();
      
      // Navigate to MainHome landing page
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // In case of error, stop loading indicator
      setLocalLoading(false);
      // You might want to show an error message to the user
    }
  };
  
  // Function to handle navigation to ScanScreen
  const navigateToScan = () => {
    navigate('/scan');
  };

  // Function to handle navigation to GroceryScreen
  const navigateToGrocery = () => {
    navigate('/grocery');
  };

   // Function to handle navigation to InsightsScreen
   const navigateToInsight = () => {
    navigate('/insight');
  };

  // Function to handle navigation to HistoryScreen
  const navigateToHistory = () => {
    navigate('/history');
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
  
  // Navigation tile data
  const navigationTiles = [
    { id: 'scan', label: 'Scan', icon: <Camera size={28} />, color: 'from-green-500 to-green-700', onClick: navigateToScan },
    { id: 'history', label: 'History', icon: <History size={28} />, color: 'from-blue-500 to-blue-700', onClick: navigateToHistory },
    { id: 'insights', label: 'Insights', icon: <PieChart size={28} />, color: 'from-purple-500 to-purple-700', onClick: navigateToInsight },
    { id: 'shop', label: 'Shop', icon: <ShoppingCart size={28} />, color: 'from-orange-500 to-orange-700', onClick: navigateToGrocery }
  ];

  // Loading state display
  if (userLoading || localLoading) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 items-center justify-center">
        <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="animate-spin mb-6 mx-auto">
            <Loader size={48} className="text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading your RipenTech data...</h2>
          <p className="text-gray-600">Preparing your personalized fruit dashboard</p>
          <div className="mt-6 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-600 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state display
  if (error || scanError) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 items-center justify-center">
        <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="mx-auto mb-6 bg-red-100 rounded-full p-4 w-16 h-16 flex items-center justify-center">
            <Info size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error || scanError}</p>
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

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200">
      {/* Top Navigation Bar */}
      <header className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center space-x-2">
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
              placeholder="Search fruits, tips, recipes..." 
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
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome Section with Seasonal Tips */}
            <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-5 border-l-4 border-green-600">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Welcome, {getDisplayName()}
                  </h2>
                  <p className="text-green-700 font-medium mt-1">The Future of Fruit Ripeness Detection</p>
                </div>
                <div className="bg-green-50 px-3 py-1 rounded-full text-green-700 text-sm font-medium">
                  Spring Harvest
                </div>
              </div>
              <p className="text-gray-600 mt-3 text-sm">Today's Tip: Spring strawberries are entering peak season. Look for bright red color with no white shoulders for optimal ripeness.</p>
              
              {/* User organization if available */}
              {userDetails?.organization && (
                <div className="mt-3 text-xs bg-blue-50 p-2 rounded text-blue-700 inline-block">
                  Organization: {userDetails.organization}
                </div>
              )}
            </div>
            
            {/* Floating Navigation Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {navigationTiles.map((tile) => (
                <button 
                  key={tile.id}
                  onClick={tile.onClick || (() => setActiveTab(tile.id))}
                  className="bg-white bg-opacity-90 rounded-xl shadow-md p-6 flex flex-col items-center justify-center transition-all duration-200 hover:bg-green-50 hover:shadow-lg hover:scale-105 relative overflow-hidden"
                >
                  <div className={`bg-gradient-to-r ${tile.color} text-white rounded-full p-4 mb-3 shadow-md`}>
                    {tile.icon}
                  </div>
                  <span className="font-medium text-gray-700 z-10">{tile.label}</span>
                  <div className="absolute inset-0 bg-green-100 opacity-0 hover:opacity-30 transition-opacity duration-200"></div>
                </button>
              ))}
            </div>
            
            {/* Recently Detected Fruits - Now using actual data */}
            <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Recently Detected Fruits</h2>
                <button 
                  onClick={() => setActiveTab('history')}
                  className="text-green-600 text-sm font-medium hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {detectedFruits.length > 0 ? (
                  detectedFruits.map((fruit, index) => (
                    <div key={index} className="flex items-center p-4 bg-green-50 rounded-lg hover:shadow-md transition-shadow">
                      <img src={fruit.image} alt={fruit.name} className="w-16 h-16 rounded-lg mr-4 object-cover shadow-sm" />
                      <div className="flex-grow">
                        <h3 className="font-semibold text-gray-800">{fruit.name} <span className="text-gray-500 text-sm">({fruit.variety})</span></h3>
                        <div className="flex items-center mt-2">
                          <div className="w-32 h-4 bg-gray-200 rounded-full mr-3">
                            <div 
                              className={`h-4 rounded-full ${
                                fruit.ripeness > 80 ? 'bg-green-500' : 
                                fruit.ripeness > 60 ? 'bg-yellow-500' : 'bg-orange-400'
                              }`} 
                              style={{ width: `${fruit.ripeness}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{fruit.ripeness}% Ripe</span>
                        </div>
                      </div>
                      <div className="text-center bg-white rounded-lg p-3 shadow-sm border border-green-100">
                        <span className="text-lg font-semibold text-green-700">{fruit.daysToRipe}</span>
                        <p className="text-xs text-gray-500">
                          {fruit.daysToRipe === 0 ? 'Ready now!' : 
                           fruit.daysToRipe < 0 ? 'Past peak' : 
                           `${fruit.daysToRipe} ${fruit.daysToRipe === 1 ? 'day' : 'days'} until peak`}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8">
                    <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
                      <Camera size={32} className="text-green-600" />
                    </div>
                    <h3 className="font-medium text-gray-700 mb-2">No fruits detected yet</h3>
                    <p className="text-gray-500 text-sm mb-4">Start scanning fruits to see your results here</p>
                    <button 
                      onClick={navigateToScan}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg"
                    >
                      Scan Now
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Grocery Helper */}
              <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Smart Grocery Helper</h2>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">AI Powered</span>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 font-medium">Based on your preferences and current inventory:</p>
                  <ul className="mt-3 space-y-3">
                    <li className="text-sm flex items-start">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2 mt-1"></span>
                      <div>
                        <span className="font-medium">Avocados:</span> Buy now for meals in 4-5 days
                      </div>
                    </li>
                    <li className="text-sm flex items-start">
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-2 mt-1"></span>
                      <div>
                        <span className="font-medium">Bananas:</span> Consider buying greener ones if not for immediate use
                      </div>
                    </li>
                    <li className="text-sm flex items-start">
                      <span className="w-3 h-3 bg-blue-500 rounded-full mr-2 mt-1"></span>
                      <div>
                        <span className="font-medium">Seasonal Alert:</span> Strawberries are at peak season - good time to buy
                      </div>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={navigateToGrocery}
                  className="mt-4 w-full py-3 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                >
                  <ShoppingCart size={18} className="mr-2" />
                  Create Smart Shopping List
                </button>
              </div>
              
              {/* User Activity & Scan History - Now using real data */}
              <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Recent Scans</h2>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className="text-green-600 text-sm font-medium hover:underline"
                  >
                    View History
                  </button>
                </div>
                
                {/* User stats */}
                {userDetails?.lastLogin && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Last login:</span> {userDetails.lastLogin.toDate ? userDetails.lastLogin.toDate().toLocaleDateString() : 'Recently'}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Account created: {userDetails.createdAt?.toDate ? userDetails.createdAt.toDate().toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                )}
                
                <div className="space-y-1">
                  {recentScans.length > 0 ? (
                    recentScans.map((scan, index) => (
                      <div key={index} className="flex items-center justify-between py-3 px-2 border-b border-gray-100 hover:bg-green-50 rounded-lg transition-colors">
                        <div>
                          <p className="font-medium text-gray-800">{scan.fruits.join(', ')}</p>
                          <p className="text-xs text-gray-500 mt-1">{scan.location} • {scan.date}</p>
                        </div>
                        <button className="text-green-600 bg-green-50 p-2 rounded-full hover:bg-green-100 transition-colors">
                          <Info size={18} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-gray-500">No scan history found</p>
                    </div>
                  )}
                </div>
                {recentScans.length > 0 && (
                  <div className="mt-4 bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <div className="text-green-700 bg-green-200 p-2 rounded-full mr-3">
                        <PieChart size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">Scan Insights</p>
                        <p className="text-xs text-green-700">{recentScans.length} scans recorded</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* User Settings Status */}
              {userDetails?.settings && (
                <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-5 md:col-span-2">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Preferences</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Display user settings if they exist */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-800 mb-2">Notification Settings</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
                          <span className="text-sm">{userDetails.settings.notifications?.email ? 'Email alerts enabled' : 'Email alerts disabled'}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
                          <span className="text-sm">{userDetails.settings.notifications?.push ? 'Push notifications enabled' : 'Push notifications disabled'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-800 mb-2">Display Preferences</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
                          <span className="text-sm">Theme: {userDetails.settings.theme || 'Default'}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
                          <span className="text-sm">Language: {userDetails.settings.language || 'English'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-800 mb-2">Fruit Preferences</h3>
                      {userDetails.settings.favoriteFruits ? (
                        <div>
                          <p className="text-sm mb-2">Your favorite fruits:</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(userDetails.settings.favoriteFruits) && userDetails.settings.favoriteFruits.map((fruit, index) => (
                              <span key={index} className="text-xs bg-white px-2 py-1 rounded-full">{fruit}</span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">No favorite fruits set yet</p>
                      )}
                    </div>
                  </div>
                  <button className="mt-4 bg-white border border-green-600 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors">
                    Update Preferences
                  </button>
                </div>
              )}
              
              {/* Sustainability Section */}
              <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-5 md:col-span-2">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Sustainability Impact</h2>
                <div className="flex flex-col md:flex-row items-stretch bg-green-50 rounded-lg overflow-hidden border border-green-100">
                  <div className="flex-1 p-5">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none">
  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
  <line x1="12" y1="22.08" x2="12" y2="12"></line>
</svg>
                      </div>
                      <h3 className="ml-3 font-medium text-gray-800">Environmental Impact</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">By detecting fruit ripeness accurately, you've helped reduce food waste:</p>
                    <div className="text-center py-3">
                      <div className="text-3xl font-bold text-green-700 mb-1">2.4kg</div>
                      <p className="text-sm text-gray-600">Estimated food waste prevented</p>
                    </div>
                  </div>
                  <div className="flex-1 p-5 bg-green-100">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
                        <Calendar size={24} />
                      </div>
                      <h3 className="ml-3 font-medium text-gray-800">Monthly Impact</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                        <span>Reduced CO2 emissions: 0.7kg</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                        <span>Water saved: 38 liters</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                        <span>Money saved: $14.50</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    View Full Impact Report
                  </button>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </main>
      
      {/* Bottom Navigation Bar for Mobile */}
      <nav className="md:hidden bg-white border-t border-gray-200 px-4 py-3 flex justify-around shadow-lg">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center ${activeTab === 'dashboard' ? 'text-green-600' : 'text-gray-500'}`}
        >
          <Home size={20} />
          <span className="text-xs mt-1">Home</span>
        </button>
        <button 
          onClick={navigateToScan}
          className={`flex flex-col items-center ${activeTab === 'scan' ? 'text-green-600' : 'text-gray-500'}`}
        >
          <Camera size={20} />
          <span className="text-xs mt-1">Scan</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center ${activeTab === 'history' ? 'text-green-600' : 'text-gray-500'}`}
        >
          <History size={20} />
          <span className="text-xs mt-1">History</span>
        </button>
        <button 
          onClick={() => setActiveTab('account')}
          className={`flex flex-col items-center ${activeTab === 'account' ? 'text-green-600' : 'text-gray-500'}`}
        >
          <User size={20} />
          <span className="text-xs mt-1">Account</span>
        </button>
      </nav>
    </div>
  );
};

export default Dashboard;