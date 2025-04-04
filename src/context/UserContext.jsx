import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; 

// Create the context
const UserContext = createContext();

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setLoading(true);
      try {
        if (authUser) {
          // Update last login
          await updateDoc(doc(db, 'users', authUser.uid), {
            lastLogin: serverTimestamp()
          }).catch(error => {
            // If document doesn't exist yet, we'll create it later
            console.log('User doc may not exist yet');
          });

          // Get user document
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          
          // Set user and user details
          setUser(authUser);
          
          if (userDoc.exists()) {
            setUserDetails(userDoc.data());
          } else {
            setUserDetails(null);
          }
        } else {
          // User is signed out
          setUser(null);
          setUserDetails(null);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    // Clean up the listener
    return () => unsubscribe();
  }, []);

  // Create or update user profile
  const updateUserProfile = async (userData) => {
    try {
      if (!user) throw new Error('No authenticated user');
      
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update existing user
        await updateDoc(userRef, {
          ...userData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new user document
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          authProvider: user.providerData[0]?.providerId || 'unknown',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          accountStatus: 'active',
          ...userData
        });
      }
      
      // Get updated user data
      const updatedDoc = await getDoc(userRef);
      setUserDetails(updatedDoc.data());
      
      return updatedDoc.data();
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError(err.message);
      throw err;
    }
  };

  // Update specific user settings
  const updateUserSettings = async (settings) => {
    try {
      if (!user) throw new Error('No authenticated user');
      
      const userRef = doc(db, 'users', user.uid);
      
      // Get current user data
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('User profile does not exist');
      }
      
      // Update only the settings object
      await updateDoc(userRef, {
        settings: {
          ...userDoc.data().settings,
          ...settings
        },
        updatedAt: serverTimestamp()
      });
      
      // Get updated user data
      const updatedDoc = await getDoc(userRef);
      setUserDetails(updatedDoc.data());
      
      return updatedDoc.data().settings;
    } catch (err) {
      console.error('Error updating user settings:', err);
      setError(err.message);
      throw err;
    }
  };

  // Check if the user's profile is complete
  const checkProfileComplete = (userData = userDetails) => {
    if (!userData) return false;
    
    const requiredFields = ['name', 'email', 'organization', 'agreedToTerms'];
    return requiredFields.every(field => !!userData[field]);
  };

  // Add logout function
  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      // The auth state listener will handle setting user to null
      return true;
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const value = {
    user,                // Firebase auth user object
    userDetails,         // Custom user data from Firestore
    loading,             // Loading state
    error,               // Error state
    updateUserProfile,   // Function to update user profile
    updateUserSettings,  // Function to update just the settings object
    checkProfileComplete, // Function to check if profile is complete
    logout               // Function to sign out user
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;