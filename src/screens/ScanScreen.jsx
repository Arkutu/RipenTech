import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle, AlertCircle, Info, ArrowLeft, X, Image, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext'; // Import the user context
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore functions
import { db } from '../firebaseConfig'; // Import your Firebase config

const ScanScreen = () => {
  const [scanMethod, setScanMethod] = useState(''); // 'camera' or 'upload'
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Use user context to get current user
  const { user, userDetails } = useUser();
  
  // Use ngrok URL provided in console
  const API_URL = 'https://1f63-34-16-205-97.ngrok-free.app';
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  // Setup camera stream when user selects camera method
  useEffect(() => {
    let stream = null;
    
    const setupCamera = async () => {
      if (scanMethod === 'camera') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setCameraPermission(true);
        } catch (err) {
          console.error('Camera access error:', err);
          setCameraPermission(false);
          setError('Unable to access camera. Please check permissions and try again.');
        }
      }
    };
    
    setupCamera();
    
    // Cleanup function to stop camera when component unmounts or method changes
    return () => {
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [scanMethod]);
  
  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Capture image from camera
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to data URL
      const imageDataURL = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageDataURL);
      setIsCapturing(false);
    }
  };
  
  // Reset capture process
  const resetCapture = () => {
    setCapturedImage(null);
    setUploadedImage(null);
    setScanResults(null);
    setError(null);
    setIsCapturing(true);
  };
  
  // Start new scan process
  const startNewScan = () => {
    setCapturedImage(null);
    setUploadedImage(null);
    setScanResults(null);
    setScanMethod('');
    setError(null);
    setIsAnalyzing(false);
    setNotes('');
  };
  
  // Generate random scan ID
  const generateScanId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };
  
  // Save scan results to Firebase
  const saveScanToFirebase = async () => {
    if (!user) {
      setError("You must be logged in to save scan results");
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Create document data
      const scanData = {
        userId: user.uid,
        scanId: scanResults.scanId,
        fruit: scanResults.fruit,
        ripeness: scanResults.ripeness,
        confidence: scanResults.confidence,
        confidenceFruit: scanResults.confidenceFruit,
        imageUrl: scanResults.image ? `data:image/png;base64,${scanResults.image}` : (capturedImage || uploadedImage),
        scannedAt: serverTimestamp(),
        notes: notes
      };
      
      // Add document to fruitScans collection
      const docRef = await addDoc(collection(db, 'fruitScans'), scanData);
      
      console.log("Scan saved with ID: ", docRef.id);
      
      // Optionally navigate to a success screen or show a notification
      alert("Scan results saved successfully!");
      return docRef.id;
    } catch (err) {
      console.error("Error saving scan:", err);
      setError("Failed to save scan results: " + err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Analyze fruit ripeness
  const analyzeFruit = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    const imageToAnalyze = capturedImage || uploadedImage;
    
    try {
      // Process image - convert data URL to blob
      const fetchResponse = await fetch(imageToAnalyze);
      const blob = await fetchResponse.blob();
      
      // Create form data to send to API
      const formData = new FormData();
      formData.append('file', blob, 'fruit_image.jpg'); // Change 'image' to 'file' to match backend
      
      // Send to Flask API - using ngrok URL
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const apiResults = await response.json();
      
      console.log('API Response:', apiResults);
      
      // Format results using backend data
      const ripenessState = apiResults.ripeness;
      const fruitType = apiResults.fruit;
      
      // Create comprehensive results structure
      const formattedResults = {
        scanId: generateScanId(),
        fruit: fruitType,
        ripeness: ripenessState,
        confidence: apiResults.confidence_ripeness,
        confidenceFruit: apiResults.confidence_fruit,
        image: apiResults.image // The backend returns a base64 image with annotations
      };
      
      setScanResults(formattedResults);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Unable to analyze image. Please try again. ' + err.message);
      
      // For demo/testing - generate mock data if API fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Generating mock data for development');
        const mockResults = {
          scanId: generateScanId(),
          fruit: 'Apple',
          ripeness: 'Ripe',
          confidence: 95,
          confidenceFruit: 92
        };
        setScanResults(mockResults);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Render different steps of the scan process
  
  // 1. Initial method selection screen
  if (!scanMethod) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200">
        {/* Header */}
        <header className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4 shadow-lg">
          <div className="flex items-center max-w-6xl mx-auto">
            <button 
              onClick={() => navigate('/dashboard')}
              className="mr-4 bg-white bg-opacity-20 rounded-full p-2 hover:bg-opacity-30 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold">Fruit Scanner</h1>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-grow overflow-auto p-4 md:p-6 max-w-6xl mx-auto w-full flex flex-col items-center justify-center">
          <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-6 md:p-8 w-full max-w-md text-center">
            <div className="bg-green-100 rounded-full p-6 inline-block mb-6">
              <Camera size={48} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Scan Your Fruits</h2>
            <p className="text-gray-600 mb-8">Analyze fruit type and ripeness: ripe or unripe</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => {
                  setScanMethod('camera');
                  setIsCapturing(true);
                }}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center"
              >
                <Camera size={20} className="mr-2" />
                Take Photo
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
              
              <button 
                onClick={() => setScanMethod('upload')}
                className="w-full py-4 bg-white border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-all flex items-center justify-center"
              >
                <Upload size={20} className="mr-2" />
                Upload Image
              </button>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left">
              <div className="flex">
                <Info size={20} className="text-blue-500 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">For best results:</p>
                  <ul className="space-y-1 list-disc pl-5">
                    <li>Ensure good lighting</li>
                    <li>Place fruits on a plain surface</li>
                    <li>Make sure the fruit is clearly visible</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // 2. Camera capture screen
  if (scanMethod === 'camera' && isCapturing) {
    return (
      <div className="flex flex-col h-screen bg-black">
        {/* Camera view */}
        <div className="relative flex-grow flex items-center justify-center">
          {cameraPermission ? (
            <>
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Capture guide overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="h-full flex flex-col items-center justify-center p-6">
                  <div className="border-2 border-white border-opacity-70 rounded-lg w-full max-w-lg aspect-video flex items-center justify-center">
                    <div className="text-white text-opacity-90 text-center p-4 bg-black bg-opacity-40 rounded-lg">
                      <p className="font-medium">Position fruit in this area</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Hidden canvas for capturing images */}
              <canvas ref={canvasRef} className="hidden" />
            </>
          ) : (
            <div className="text-center p-6 bg-gray-900 text-white rounded-lg">
              <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-semibold mb-2">Camera Access Denied</h3>
              <p className="mb-4">Please allow camera access in your browser settings to use this feature.</p>
              <button 
                onClick={startNewScan}
                className="px-4 py-2 bg-white text-gray-900 rounded-lg"
              >
                Go Back
              </button>
            </div>
          )}
        </div>
        
        {/* Camera controls */}
        <div className="bg-black p-6 flex items-center justify-between">
          <button 
            onClick={startNewScan}
            className="bg-gray-800 text-white p-4 rounded-full"
          >
            <X size={24} />
          </button>
          
          <button 
            onClick={captureImage}
            className="bg-white text-gray-900 p-5 rounded-full"
          >
            <div className="h-8 w-8 rounded-full border-4 border-gray-900"></div>
          </button>
          
          <div className="w-12"></div> {/* Empty space for balance */}
        </div>
      </div>
    );
  }
  
  // 3. Upload screen
  if (scanMethod === 'upload' && !uploadedImage) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200">
        {/* Header */}
        <header className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4 shadow-lg">
          <div className="flex items-center max-w-6xl mx-auto">
            <button 
              onClick={startNewScan}
              className="mr-4 bg-white bg-opacity-20 rounded-full p-2 hover:bg-opacity-30 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold">Upload Image</h1>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-grow overflow-auto p-4 md:p-6 max-w-6xl mx-auto w-full flex flex-col items-center justify-center">
          <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-6 w-full max-w-md">
            <div 
              className="border-2 border-dashed border-green-300 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-green-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="bg-green-100 rounded-full p-5 mb-4">
                <Image size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Upload a Fruit Image</h3>
              <p className="text-sm text-gray-500 mb-2">Click to browse files or drag and drop</p>
              <p className="text-xs text-gray-400">Supports: JPG, PNG</p>
              
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg, image/png"
                onChange={handleFileUpload}
              />
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex">
                <Info size={20} className="text-blue-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  For accurate results, ensure your image is well-lit and shows the fruit clearly.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // 4. Review and analyze image screen
  if ((capturedImage || uploadedImage) && !scanResults && !isAnalyzing) {
    const previewImage = capturedImage || uploadedImage;
    
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200">
        {/* Header */}
        <header className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4 shadow-lg">
          <div className="flex items-center max-w-6xl mx-auto">
            <button 
              onClick={() => {
                if (scanMethod === 'camera') {
                  resetCapture();
                } else {
                  setUploadedImage(null);
                }
              }}
              className="mr-4 bg-white bg-opacity-20 rounded-full p-2 hover:bg-opacity-30 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold">Review Image</h1>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-grow overflow-auto p-4 md:p-6 max-w-6xl mx-auto w-full flex flex-col">
          <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-4 md:p-6 w-full">
            <div className="relative rounded-lg overflow-hidden mb-4 border border-gray-200">
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-full object-contain max-h-80 mx-auto"
              />
            </div>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <div className="flex">
                  <AlertCircle size={20} className="text-red-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button 
                onClick={() => {
                  if (scanMethod === 'camera') {
                    resetCapture();
                  } else {
                    setUploadedImage(null);
                  }
                }}
                className="py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center"
              >
                <RefreshCw size={18} className="mr-2" />
                Take New
              </button>
              
              <button 
                onClick={analyzeFruit}
                className="py-3 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center"
              >
                <CheckCircle size={18} className="mr-2" />
                Analyze
              </button>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex">
                <Info size={20} className="text-yellow-500 mr-2 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Before analyzing:</p>
                  <ul className="space-y-1 list-disc pl-5">
                    <li>Check that fruit is visible and not blurry</li>
                    <li>Make sure lighting is good with minimal shadows</li>
                    <li>Ensure fruit is the main focus of the image</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // 5. Analyzing loading screen
  if (isAnalyzing) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200">
        {/* Header */}
        <header className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4 shadow-lg">
          <div className="flex items-center max-w-6xl mx-auto">
            <h1 className="text-xl font-semibold">Analyzing</h1>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-grow overflow-auto p-4 md:p-6 max-w-6xl mx-auto w-full flex flex-col items-center justify-center">
          <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-8 max-w-md text-center">
            <div className="animate-spin mb-6 mx-auto">
              <Loader size={48} className="text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Analyzing Your Fruit</h2>
            <p className="text-gray-600 mb-4">Our AI is determining fruit type and ripeness status...</p>
            
            <div className="mt-6 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-600 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
            
            <p className="mt-4 text-sm text-gray-500">This usually takes less than 10 seconds</p>
          </div>
        </main>
      </div>
    );
  }
  
  // 6. Results screen
  if (scanResults) {
    const previewImage = scanResults.image ? `data:image/png;base64,${scanResults.image}` : (capturedImage || uploadedImage);
    
    // Get color and description based on ripeness state
    const getRipenessDisplay = (ripenessState) => {
      switch(ripenessState) {
        case 'Ripe':
          return {
            color: 'bg-green-500',
            textColor: 'text-green-800',
            bgColor: 'bg-green-100',
            description: 'Perfect for immediate consumption',
            icon: <CheckCircle size={24} className="text-green-600" />
          };
        case 'Overripe':
          return {
            color: 'bg-red-500',
            textColor: 'text-red-800',
            bgColor: 'bg-red-100',
            description: 'Best consumed immediately or used for cooking',
            icon: <AlertCircle size={24} className="text-red-600" />
          };
        case 'Unripe':
          return {
            color: 'bg-blue-500',
            textColor: 'text-blue-800',
            bgColor: 'bg-blue-100',
            description: 'Needs several days to ripen at room temperature',
            icon: <Info size={24} className="text-blue-600" />
          };
        default:
          return {
            color: 'bg-gray-500',
            textColor: 'text-gray-800',
            bgColor: 'bg-gray-100',
            description: 'Unable to determine ripeness accurately',
            icon: <AlertCircle size={24} className="text-gray-600" />
          };
      }
    };
    
    const ripenessDisplay = getRipenessDisplay(scanResults.ripeness);
    
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200">
        {/* Header */}
        <header className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4 shadow-lg">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <h1 className="text-xl font-semibold">Scan Results</h1>
            <button 
              onClick={startNewScan}
              className="bg-white bg-opacity-20 rounded-full p-2 hover:bg-opacity-30 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-grow overflow-auto p-4 md:p-6 max-w-6xl mx-auto w-full">
          <div className="bg-white bg-opacity-90 rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="relative">
              <img 
                src={previewImage} 
                alt="Scanned Image" 
                className="w-full object-cover h-48 md:h-64"
              />
              <div className="absolute bottom-0 right-0 m-4 bg-green-600 text-white text-xs font-medium px-2 py-1 rounded">
                Scan ID: {scanResults.scanId || 'AB1234'}
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Analysis Result</h2>
                <div className="text-xs bg-white px-2 py-1 rounded border border-green-100">
                  Confidence: {(scanResults.confidence).toFixed(0)}%
                </div>
              </div>
              
              {/* Fruit type */}
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-1">Detected Fruit</h3>
                <div className="flex items-center">
                  <span className="text-xl font-bold text-green-800">{scanResults.fruit}</span>
                  {scanResults.confidenceFruit && (
                    <span className="ml-2 text-xs bg-white px-2 py-1 rounded border border-green-100">
                      Confidence: {(scanResults.confidenceFruit).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              
              {/* Main ripeness result */}
              <div className={`rounded-lg p-6 ${ripenessDisplay.bgColor} mb-6`}>
                <div className="flex items-center justify-center">
                  {ripenessDisplay.icon}
                  <h3 className="text-3xl font-bold ml-3">{scanResults.ripeness}</h3>
                </div>
                
                <div className="mt-4 text-center">
                  <p className={`${ripenessDisplay.textColor} font-medium`}>
                    {ripenessDisplay.description}
                  </p>
                </div>
              </div>
              
              {/* Storage and ripening advice */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Storage Advice</h3>
                <p className="text-gray-700">
                  {scanResults.ripeness === 'Ripe' && 
                    `Store your ${scanResults.fruit} in the refrigerator to maintain freshness for a few more days.`}
                  {scanResults.ripeness === 'Overripe' && 
                    `Your ${scanResults.fruit} is best used immediately. Consider using in smoothies, baking, or cooking.`}
                  {scanResults.ripeness === 'Unripe' && 
                    `Keep your ${scanResults.fruit} at room temperature until ripe, away from direct sunlight.`}
                  {!['Ripe', 'Overripe', 'Unripe'].includes(scanResults.ripeness) && 
                    `Store according to the specific fruit type. Most fruits benefit from refrigeration when ripe.`}
                </p>
              </div>
              
              {/* Notes section */}
              <div className="mb-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Add Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  rows="3"
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                  placeholder="Add notes about this fruit..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col space-y-4 mb-6">
            {/* Save button */}
            <button 
  onClick={saveScanToFirebase}
  disabled={isSaving || !user}
  className={`py-3 ${user ? 'bg-gradient-to-r from-blue-500 to-blue-700' : 'bg-gray-400'} text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center`}
>
  {isSaving ? <Loader size={18} className="mr-2 animate-spin" /> : 
  <CheckCircle size={18} className="mr-2" />}
  {isSaving ? 'Saving...' : 'Save Results'}
</button>

{/* New scan button */}
<button 
  onClick={startNewScan}
  className="py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center"
>
  <RefreshCw size={18} className="mr-2" />
  Start New Scan
</button>
</div>
        </main>
      </div>
    );
  }
  
  return null; // Default return if no condition is met
};

export default ScanScreen;