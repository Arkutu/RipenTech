import React, { useEffect, useState } from 'react';

const Splash = ({ setLoading }) => {
  const [loaded, setLoaded] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  
  useEffect(() => {
    // Show animation stages
    setTimeout(() => {
      setLoaded(true);
    }, 500);
    
    setTimeout(() => {
      setTextVisible(true);
    }, 1000);
    
    // After animations complete, switch to main app content
    setTimeout(() => {
      setLoading(false);
    }, 3000); // 3 seconds total for splash screen
  }, [setLoading]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-green-50 via-green-100 to-green-200">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-green-300 to-transparent opacity-10"></div>
      
      {/* Container for the animation */}
      <div className="relative z-10">
        {/* The circle that expands */}
        <div className={`rounded-full bg-gradient-to-br from-green-400 to-green-600 transition-all duration-1000 ease-out ${
          loaded ? 'h-64 w-64 opacity-40' : 'h-0 w-0 opacity-0'
        }`}>
        </div>
        
        {/* Logo - fruit icon similar to main app */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`transition-all duration-700 delay-500 ${
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}>
            <div className="relative h-24 w-24 mr-2">
              {/* Hexagon base shape */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-500 rounded-lg transform rotate-45"></div>
              
              {/* Fruit icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-12 h-12 text-white" fill="currentColor">
                  <path d="M7,2C4,2 2,5 2,8C2,10.11 3,13 4,14C5,15 6,22 6,22H18C18,22 19,15 20,14C21,13 22,10.11 22,8C22,5 20,2 17,2C14,2 13,4 12,4C11,4 10,2 7,2Z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Text that fades in */}
      <div className={`mt-8 transition-all duration-1000 ease-in-out flex flex-col items-center ${
        textVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'
      }`}>
        <h1 className="text-4xl font-bold tracking-wide">
          <span className="text-green-600">RIPEN</span>
          <span className="text-gray-700 font-normal"> TECH</span>
        </h1>
        <p className="text-green-600 mt-2 text-lg">The Future of Fruit Ripeness Detection</p>
      </div>
    </div>
  );
};

export default Splash;