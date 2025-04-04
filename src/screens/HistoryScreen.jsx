import React, { useState, useEffect } from 'react';
import { Camera, Calendar, Filter, Search, ArrowLeft, Trash2, BarChart2, ShoppingBag, Download, Bell, Settings, User, LogOut, Home } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const HistoryScreen = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const { user, userDetails, loading: userLoading, logout } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) return;
    
    const fetchHistoryData = async () => {
      try {
        setLoading(true);
        
        // Get current date for filtering
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Filter by date if needed
        let startDate = null;
        if (dateRange === 'week') {
          startDate = oneWeekAgo;
        } else if (dateRange === 'month') {
          startDate = oneMonthAgo;
        }
        
        // Fetch from fruitScans collection
        const scansRef = collection(db, 'fruitScans');
        let scansQuery = query(
          scansRef,
          where('userId', '==', user.uid),
          orderBy('scannedAt', 'desc')
        );
        
        const scansSnapshot = await getDocs(scansQuery);
        
        // Fetch from groceryItems collection
        const groceryRef = collection(db, 'groceryItems');
        let groceryQuery = query(
          groceryRef,
          where('userId', '==', user.uid),
          orderBy('addedAt', 'desc')
        );
        
        const grocerySnapshot = await getDocs(groceryQuery);
        
        // Process scan data
        const scanItems = [];
        scansSnapshot.forEach((doc) => {
          const data = doc.data();
          if (startDate && data.scannedAt.toDate() < startDate) {
            return; // Skip items outside of date range
          }
          
          scanItems.push({
            id: doc.id,
            type: 'scan',
            fruit: data.fruit,
            date: data.scannedAt.toDate(),
            displayDate: data.scannedAt.toDate().toLocaleDateString(),
            imageUrl: data.imageUrl || '/api/placeholder/80/80',
            ripeness: data.ripeness || 'Unknown',
            confidence: data.confidence || data.confidenceFruit || 0,
            notes: data.notes || '',
            scanId: data.scanId || doc.id
          });
        });
        
        // Process grocery data
        const groceryItems = [];
        grocerySnapshot.forEach((doc) => {
          const data = doc.data();
          if (startDate && data.addedAt.toDate() < startDate) {
            return; // Skip items outside of date range
          }
          
          groceryItems.push({
            id: doc.id,
            type: 'grocery',
            fruit: data.fruit,
            date: data.addedAt.toDate(),
            displayDate: data.addedAt.toDate().toLocaleDateString(),
            imageUrl: data.image || '/api/placeholder/80/80',
            ripeness: data.ripeness || 'Unknown',
            confidence: data.confidenceFruit || data.confidenceRipeness || 0,
            status: data.status || 'Active',
            recommendation: data.recommendation || '',
            consumedAt: data.consumedAt ? data.consumedAt.toDate() : null
          });
        });
        
        // Combine both types of items and sort by date
        const allItems = [...scanItems, ...groceryItems].sort((a, b) => b.date - a.date);
        
        setHistoryItems(allItems);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching history data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchHistoryData();
  }, [user?.uid, dateRange]);

  // Filter items based on user selection
  const filteredItems = historyItems.filter(item => {
    // Apply type filter
    if (activeFilter === 'scans' && item.type !== 'scan') return false;
    if (activeFilter === 'grocery' && item.type !== 'grocery') return false;
    
    // Apply search term filter
    if (searchTerm && !item.fruit.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Handle logout function
  const handleLogout = async () => {
    try {
      setProfileDropdownOpen(false);
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Navigate back to dashboard
  const navigateToDashboard = () => {
    navigate('/dashboard');
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

  // Group items by date
  const groupedItems = filteredItems.reduce((groups, item) => {
    const date = item.displayDate;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});
  
  // Loading state
  if (userLoading || loading) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 items-center justify-center">
        <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="animate-spin mb-6 mx-auto">
            <Search size={48} className="text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading your scan history...</h2>
          <p className="text-gray-600">Retrieving your RipenTech data</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 items-center justify-center">
        <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="mx-auto mb-6 bg-red-100 rounded-full p-4 w-16 h-16 flex items-center justify-center">
            <ArrowLeft size={32} className="text-red-600" />
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
      {/* Top Navigation Bar - Same as Dashboard */}
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
        {/* History Header with back button */}
        <div className="flex items-center mb-6">
          <button 
            onClick={navigateToDashboard}
            className="mr-4 bg-white rounded-full p-2 shadow-md hover:bg-green-50"
          >
            <ArrowLeft size={20} className="text-green-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Scan History</h1>
            <p className="text-gray-600">View and analyze your fruit scanning activity</p>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="bg-white bg-opacity-90 rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Filter tabs */}
            <div className="flex space-x-2">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg ${activeFilter === 'all' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
              >
                All Items
              </button>
              <button 
                onClick={() => setActiveFilter('scans')}
                className={`px-4 py-2 rounded-lg ${activeFilter === 'scans' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
              >
                <span className="hidden md:inline">Fruit</span> Scans
              </button>
              <button 
                onClick={() => setActiveFilter('grocery')}
                className={`px-4 py-2 rounded-lg ${activeFilter === 'grocery' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
              >
                Grocery Items
              </button>
            </div>

            {/* Date range & Mobile search */}
            <div className="flex space-x-2">
              <div className="md:hidden relative flex-grow">
                <input
                  type="text"
                  placeholder="Search fruits..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={16} className="absolute left-3 top-2.5 text-gray-500" />
              </div>
              <select 
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-green-500"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* History Items Section */}
        <div className="space-y-6">
          {Object.keys(groupedItems).length > 0 ? (
            Object.keys(groupedItems).map((date) => (
              <div key={date} className="bg-white bg-opacity-90 rounded-xl shadow-md overflow-hidden">
                <div className="bg-green-50 py-3 px-4 border-b border-green-100">
                  <div className="flex items-center">
                    <Calendar size={18} className="text-green-700 mr-2" />
                    <h3 className="font-medium text-green-800">{date}</h3>
                    <span className="ml-auto bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full">
                      {groupedItems[date].length} {groupedItems[date].length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {groupedItems[date].map((item) => (
                    <div key={item.id} className="p-4 hover:bg-green-50 transition-colors">
                      <div className="flex items-center">
                        {/* Item image */}
                        <div className="h-16 w-16 rounded-lg overflow-hidden mr-4 shadow-sm border border-gray-200">
                          <img 
                            src={item.imageUrl} 
                            alt={item.fruit} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        
                        {/* Item details */}
                        <div className="flex-grow">
                          <div className="flex items-center">
                            <h4 className="font-medium text-gray-800">{item.fruit}</h4>
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                              item.type === 'scan' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {item.type === 'scan' ? 'Scan' : 'Grocery'}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <div className="mr-4">
                              <span className="font-medium">Ripeness:</span> {item.ripeness}
                            </div>
                            <div>
                              <span className="font-medium">Confidence:</span> {Math.round(item.confidence)}%
                            </div>
                          </div>
                          
                          {/* Item specific details */}
                          {item.type === 'scan' && item.notes && (
                            <p className="text-xs text-gray-500 mt-1 italic">Note: {item.notes}</p>
                          )}
                          
                          {item.type === 'grocery' && (
                            <div className="mt-1">
                              <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                                item.status === 'Active' ? 'bg-green-100 text-green-800' :
                                item.status === 'Consumed' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {item.status}
                              </span>
                              {item.recommendation && (
                                <span className="text-xs text-gray-500 ml-2">{item.recommendation}</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex space-x-2">
                          <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                            {item.type === 'scan' ? <BarChart2 size={18} className="text-blue-600" /> : <ShoppingBag size={18} className="text-purple-600" />}
                          </button>
                          <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                            <Trash2 size={18} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-8 text-center">
              <div className="mx-auto mb-6 bg-green-100 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                <Search size={28} className="text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No results found</h2>
              <p className="text-gray-600 mb-6">
                {searchTerm ? `No items matching "${searchTerm}"` : 'No scan history available for this filter'}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg mr-3 hover:bg-gray-300 transition-colors"
                >
                  Clear Search
                </button>
              )}
              <button 
                onClick={() => {
                  setActiveFilter('all');
                  setDateRange('all');
                  setSearchTerm('');
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
        
        {/* Analytics Summary */}
        {filteredItems.length > 0 && (
          <div className="mt-8 bg-white bg-opacity-90 rounded-xl shadow-md p-5">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Activity Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Total Scans</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">
                      {historyItems.filter(item => item.type === 'scan').length}
                    </p>
                  </div>
                  <div className="bg-blue-200 rounded-full p-3">
                    <Camera size={24} className="text-blue-700" />
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-800">Grocery Items</p>
                    <p className="text-2xl font-bold text-purple-700 mt-1">
                      {historyItems.filter(item => item.type === 'grocery').length}
                    </p>
                  </div>
                  <div className="bg-purple-200 rounded-full p-3">
                    <ShoppingBag size={24} className="text-purple-700" />
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Top Fruit</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                      {(() => {
                        const fruitCounts = {};
                        historyItems.forEach(item => {
                          fruitCounts[item.fruit] = (fruitCounts[item.fruit] || 0) + 1;
                        });
                        const topFruit = Object.entries(fruitCounts).sort((a, b) => b[1] - a[1])[0];
                        return topFruit ? topFruit[0] : 'N/A';
                      })()}
                    </p>
                  </div>
                  <div className="bg-green-200 rounded-full p-3">
                    <Filter size={24} className="text-green-700" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap justify-end">
              <button className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg mr-3">
                <Download size={18} className="mr-2" />
                Export Data
              </button>
            </div>
          </div>
        )}
      </main>
      
      {/* Bottom Navigation Bar for Mobile - Same as Dashboard */}
      <nav className="md:hidden bg-white border-t border-gray-200 px-4 py-3 flex justify-around shadow-lg">
        <button 
          onClick={navigateToDashboard}
          className="flex flex-col items-center text-gray-500"
        >
          <Home size={20} />
          <span className="text-xs mt-1">Home</span>
        </button>
        <button 
          onClick={() => navigate('/scan')}
          className="flex flex-col items-center text-gray-500"
        >
          <Camera size={20} />
          <span className="text-xs mt-1">Scan</span>
        </button>
        <button 
          className="flex flex-col items-center text-green-600"
        >
          <Search size={20} />
          <span className="text-xs mt-1">History</span>
        </button>
        <button 
          className="flex flex-col items-center text-gray-500"
        >
          <User size={20} />
          <span className="text-xs mt-1">Account</span>
        </button>
      </nav>
    </div>
  );
};

export default HistoryScreen;