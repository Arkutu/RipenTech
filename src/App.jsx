import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Splash from './screens/Splash';
import MainHome from './screens/MainHome';
import Dashboard from './screens/Dashboard';
import AuthScreen from './screens/AuthScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ScanScreen from './screens/ScanScreen';
import GroceryScreen from './screens/GroceryScreen';
import Insight from './screens/Insight';
import HistoryScreen from './screens/HistoryScreen';
import { UserProvider, useUser } from './context/UserContext';

// Splash screen with auto-navigation
const SplashWithRedirect = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Set a timeout to navigate to main home after the splash screen
    // You can adjust the time (in milliseconds) as needed
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 3000); // 3 seconds
    
    return () => clearTimeout(timer); // Cleanup timeout on unmount
  }, [navigate]);
  
  return <Splash />;
};

// Auth route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);
  
  if (loading) return null; // Or a loading spinner
  if (!user) return null;
  return children;
};

// Public route component (redirects authenticated users)
const PublicRoute = ({ children }) => {
  const { user, loading } = useUser();
  
  if (loading) return null; // Or a loading spinner
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  // Use state to determine if it's the first load of the app
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  useEffect(() => {
    // Set isFirstLoad to false after mounting the component
    // This will persist during this session
    setIsFirstLoad(false);
    
    // You could also use sessionStorage or localStorage for persistence across page refreshes
    // Example: sessionStorage.setItem('hasVisitedSplash', 'true');
  }, []);
  
  return (
    <UserProvider>
      <Router>
        <Routes>
          {/* If it's the first load, show splash, otherwise go to main routes */}
          <Route 
            path="/" 
            element={isFirstLoad ? <Navigate to="/splash" replace /> : <MainHome />} 
          />
          
          {/* Splash screen with auto-navigation to home */}
          <Route path="/splash" element={<SplashWithRedirect />} />

          {/* Public routes */}
          <Route 
            path="/auth" 
            element={
              <PublicRoute>
                <AuthScreen />
              </PublicRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginScreen />
              </PublicRoute>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <PublicRoute>
                <SignupScreen />
              </PublicRoute>
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/scan" 
            element={
              <ProtectedRoute>
                <ScanScreen />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/grocery" 
            element={
              <ProtectedRoute>
                <GroceryScreen />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/insight" 
            element={
              <ProtectedRoute>
                <Insight />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <HistoryScreen />
              </ProtectedRoute>
            } 
          />  

          
          


          
          
          {/* Fallback route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;