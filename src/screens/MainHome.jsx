import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Scan, Cpu, Calendar, ShoppingCart, User } from 'lucide-react';

const MainHome = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [visibleSections, setVisibleSections] = useState({
    home: false,
    technology: false,
    features: false,
    team: false,
    contact: false
  });

  const sectionRefs = {
    home: useRef(null),
    technology: useRef(null),
    features: useRef(null),
    team: useRef(null),
    contact: useRef(null)
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
      
      // Determine active section based on scroll position
      const sections = ['home', 'technology', 'features', 'team', 'contact'];
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      
      if (currentSection) {
        setActiveSection(currentSection);
      }

      // Check which sections are visible
      sections.forEach(section => {
        const element = sectionRefs[section].current;
        if (element) {
          const rect = element.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          // If the section is partially visible in the viewport
          const isVisible = rect.top < windowHeight * 0.85 && rect.bottom >= 0;
          
          setVisibleSections(prev => ({
            ...prev,
            [section]: isVisible
          }));
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    // Trigger once on mount to check initial visible sections
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
      setMobileMenuOpen(false);
    }
  };

  // Navigation handler for login button
  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {/* Logo */}
                <div className="flex items-center">
                  <div className="relative h-10 w-10 mr-2">
                    {/* Hexagon base shape */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-500 rounded-lg transform rotate-45"></div>
                    
                    {/* Fruit icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                        <path d="M7,2C4,2 2,5 2,8C2,10.11 3,13 4,14C5,15 6,22 6,22H18C18,22 19,15 20,14C21,13 22,10.11 22,8C22,5 20,2 17,2C14,2 13,4 12,4C11,4 10,2 7,2Z" />
                      </svg>
                    </div>
                  </div>
                  <div className="font-bold text-xl">
                    <span className="text-green-600">RIPEN</span>
                    <span className="text-gray-700 font-normal"> TECH</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              <button 
                onClick={() => scrollToSection('technology')} 
                className={`text-gray-800 hover:text-green-500 px-3 py-2 font-semibold ${activeSection === 'technology' ? 'text-green-500' : ''}`}
              >
                OUR TECHNOLOGY
              </button>
              <button 
                onClick={() => scrollToSection('features')} 
                className={`text-gray-800 hover:text-green-500 px-3 py-2 font-semibold ${activeSection === 'features' ? 'text-green-500' : ''}`}
              >
                FEATURES
              </button>
              <button 
                onClick={() => scrollToSection('team')} 
                className={`text-gray-800 hover:text-green-500 px-3 py-2 font-semibold ${activeSection === 'team' ? 'text-green-500' : ''}`}
              >
                OUR TEAM
              </button>
              <button 
                onClick={() => scrollToSection('contact')} 
                className={`text-gray-800 hover:text-green-500 px-3 py-2 font-semibold ${activeSection === 'contact' ? 'text-green-500' : ''}`}
              >
                CONTACT US
              </button>
              <button 
                onClick={handleLoginClick}
                className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition duration-300"
              >
                <User size={18} className="mr-2" />
                LOGIN
              </button>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={handleLoginClick}
                className="bg-green-500 text-white px-4 py-2 rounded-lg mr-2 flex items-center"
              >
                <User size={16} className="mr-1" />
                <span className="text-sm font-medium">LOGIN</span>
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-green-500 focus:outline-none"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg">
            <button 
              onClick={() => scrollToSection('technology')} 
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-500 w-full text-left"
            >
              OUR TECHNOLOGY
            </button>
            <button 
              onClick={() => scrollToSection('features')} 
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-500 w-full text-left"
            >
              FEATURES
            </button>
            <button 
              onClick={() => scrollToSection('team')} 
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-500 w-full text-left"
            >
              OUR TEAM
            </button>
            <button 
              onClick={() => scrollToSection('contact')} 
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-500 w-full text-left"
            >
              CONTACT US
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        id="home" 
        ref={sectionRefs.home}
        className={`relative h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 transition-all duration-1000 transform ${visibleSections.home ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white opacity-50"></div>
          <div className="grid grid-cols-3 h-full opacity-10">
            <div className="bg-[url('/api/placeholder/800/800')] bg-cover bg-center"></div>
            <div className="bg-[url('/api/placeholder/800/800')] bg-cover bg-center"></div>
            <div className="bg-[url('/api/placeholder/800/800')] bg-cover bg-center"></div>
          </div>
        </div>
        
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-10 md:mb-0">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
                  The <span className="text-green-600">Future</span> of Fruit Ripeness Detection
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Our AI-powered technology recognizes multiple fruits and predicts their ripeness level with incredible accuracy, helping farmers and consumers make better decisions.
                </p>
                <div className="flex space-x-4">
                  
                </div>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <img 
                  src="/avoc.jpg" 
                  alt="Ripen Tech Multi-Fruit Detection" 
                  className="rounded-lg shadow-xl max-w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section 
        id="technology" 
        ref={sectionRefs.technology}
        className={`py-20 bg-white transition-all duration-1000 transform ${visibleSections.technology ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
              <div className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">OUR TECHNOLOGY</div>
              <h2 className="text-4xl font-bold text-gray-800 mb-6">AI-Powered Multi-Fruit Recognition</h2>
              <p className="text-lg text-gray-600 mb-6">
                We've trained advanced machine learning models using YOLOv8 and TensorFlow to recognize multiple types of fruits and accurately determine their ripeness levels.
              </p>
              <p className="text-lg text-gray-600">
                Our computer vision system can identify subtle color changes, texture variations, and size characteristics to provide precise ripeness information, helping farmers optimize harvest timing and consumers select the perfect produce.
              </p>
            </div>
            <div className="md:w-1/2">
              <img 
                src="/derect.jpg" 
                alt="AI Fruit Recognition Technology" 
                className="rounded-lg shadow-xl max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        ref={sectionRefs.features}
        className={`py-20 bg-gray-50 transition-all duration-1000 transform ${visibleSections.features ? 'translate-x-0 opacity-100' : 'translate-x-16 opacity-0'}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Key Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our innovative technology offers several powerful capabilities to revolutionize how we interact with fresh produce.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className={`bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition duration-500 transform ${visibleSections.features ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '200ms'}}>
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Scan className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Multi-Fruit Recognition</h3>
              <p className="text-gray-600">
                Our AI can identify and analyze multiple types of fruits, including apples, bananas, oranges, avocados, and many more.
              </p>
            </div>
            
            <div className={`bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition duration-500 transform ${visibleSections.features ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '400ms'}}>
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Cpu className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Real-Time Detection</h3>
              <p className="text-gray-600">
                Get instant analysis with our camera integration that provides real-time ripeness assessment through our mobile or web application.
              </p>
            </div>
            
            <div className={`bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition duration-500 transform ${visibleSections.features ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '600ms'}}>
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Ripeness Timeline</h3>
              <p className="text-gray-600">
                Our predictive algorithm estimates how many days until a fruit reaches optimal ripeness, helping with inventory and consumption planning.
              </p>
            </div>
            
            <div className={`bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition duration-500 transform ${visibleSections.features ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '800ms'}}>
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <ShoppingCart className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Smart Grocery Helper</h3>
              <p className="text-gray-600">
                Use our app in supermarkets to scan and select the best fruits, getting personalized recommendations based on ripeness and shelf life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section - UPDATED */}
      <section 
        id="team" 
        ref={sectionRefs.team}
        className={`py-20 bg-white transition-all duration-1000 transform ${visibleSections.team ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet the talented individuals behind Ripen Tech who are passionate about improving the way we interact with food.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Team Members - Grid Layout */}
            <div className="space-y-6">
              <div className={`bg-white rounded-lg p-6 shadow-lg transition duration-500 transform ${visibleSections.team ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '200ms'}}>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Bamuoh Ida Nuotama</h3>
                <p className="text-green-600 font-medium">Project Manager</p>
              </div>
              
              <div className={`bg-white rounded-lg p-6 shadow-lg transition duration-500 transform ${visibleSections.team ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '300ms'}}>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Addai Isaac</h3>
                <p className="text-green-600 font-medium">Backend Developer</p>
              </div>
              
              <div className={`bg-white rounded-lg p-6 shadow-lg transition duration-500 transform ${visibleSections.team ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '400ms'}}>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Benjamin Kwesi Donkoh</h3>
                <p className="text-green-600 font-medium">Frontend Developer</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className={`bg-white rounded-lg p-6 shadow-lg transition duration-500 transform ${visibleSections.team ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '500ms'}}>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Seth Ameyaw</h3>
                <p className="text-green-600 font-medium">UI/UX Designer</p>
              </div>
              
              <div className={`bg-white rounded-lg p-6 shadow-lg transition duration-500 transform ${visibleSections.team ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '600ms'}}>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Bennett Abeiku Korsah</h3>
                <p className="text-green-600 font-medium">UI/UX Designer</p>
              </div>
              
              <div className={`bg-white rounded-lg p-6 shadow-lg transition duration-500 transform ${visibleSections.team ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '700ms'}}>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Kevin Torkornoo</h3>
                <p className="text-green-600 font-medium">Frontend/AI Engineer</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className={`bg-white rounded-lg p-6 shadow-lg transition duration-500 transform ${visibleSections.team ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '800ms'}}>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Nketiah Asamoah Michael</h3>
                <p className="text-green-600 font-medium">Frontend Developer</p>
              </div>
              
              <div className={`bg-white rounded-lg p-6 shadow-lg transition duration-500 transform ${visibleSections.team ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '900ms'}}>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Melike Arkutu</h3>
                <p className="text-green-600 font-medium">Backend Developer/ML Developer</p>
              </div>
              
              <div className={`bg-white rounded-lg p-6 shadow-lg transition duration-500 transform ${visibleSections.team ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '1000ms'}}>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Patricia Owusu Afriyie</h3>
                <p className="text-green-600 font-medium">UI/UX Designer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section 
        id="contact" 
        ref={sectionRefs.contact}
        className={`py-20 bg-gray-50 transition-all duration-1000 transform ${visibleSections.contact ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">Contact Us</h2>
              <p className="text-xl text-gray-600">
                Interested in learning more about our technology or discussing potential partnerships? Get in touch with our team.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-8">
              <form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Your email"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">Subject</label>
                  <input 
                    type="text" 
                    id="subject" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Subject"
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Message</label>
                  <textarea 
                    id="message" 
                    rows="5" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Your message"
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between">
            <div className="w-full md:w-1/3 mb-8 md:mb-0">
              <div className="flex items-center mb-6">
                <div className="relative h-10 w-10 mr-2">
                  {/* Hexagon base shape */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-500 rounded-lg transform rotate-45"></div>
                  
                  {/* Fruit icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                      <path d="M7,2C4,2 2,5 2,8C2,10.11 3,13 4,14C5,15 6,22 6,22H18C18,22 19,15 20,14C21,13 22,10.11 22,8C22,5 20,2 17,2C14,2 13,4 12,4C11,4 10,2 7,2Z" />
                    </svg>
                  </div>
                </div>
                <div className="font-bold text-xl">
                  <span className="text-green-400">RIPEN</span>
                  <span className="text-gray-300 font-normal"> TECH</span>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Revolutionizing fruit ripeness detection with AI-powered technology to reduce food waste and improve consumer satisfaction.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="w-full md:w-1/4 mb-8 md:mb-0">
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => scrollToSection('technology')} 
                    className="text-gray-400 hover:text-white transition duration-300"
                  >
                    Our Technology
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('features')} 
                    className="text-gray-400 hover:text-white transition duration-300"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('team')} 
                    className="text-gray-400 hover:text-white transition duration-300"
                  >
                    Our Team
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('demo')} 
                    className="text-gray-400 hover:text-white transition duration-300"
                  >
                    Demo
                  </button>
                </li>
              </ul>
            </div>
            
            <div className="w-full md:w-1/4">
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </span>
                  <span className="text-gray-400">123 Innovation Drive, Silicon Valley, CA 94043</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </span>
                  <span className="text-gray-400">info@ripentech.com</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                  </span>
                  <span className="text-gray-400">(123) 456-7890</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400">© {new Date().getFullYear()} Ripen Tech. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainHome;