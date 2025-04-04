# RIPEN TECH

A smart application for classifying fruit ripeness using machine learning, helping users identify optimal ripeness levels for their produce or fruit.

## Overview

RIPE-ROBOTICS-AI is a mobile-friendly web application that uses computer vision and machine learning to analyze and classify the ripeness of fruits. The app provides users with real-time scanning capabilities and maintains a history of previously scanned items.

## Key Functionalities & Innovations

### Multi-Class Fruit Recognition & Ripeness Assessment
- Utilizes a dual-output MobileNetV2 model to identify fruit types and determine ripeness with confidence scores
- Implements hierarchical classification with a custom data pipeline for accurate ripeness assessment

### Ripeness Prediction Timeline
- Forecasts ripening progression based on current state
- Provides optimal harvest windows for farmers and peak consumption timing for consumers

### Web Dashboard Integration
- Users can scan fruits via their device camera for real-time analysis
- Displays fruit type, ripeness status, confidence scores, and storage recommendations
- Includes a visual ripeness progression timeline

### Smart Grocery Helper
- Mobile-optimized scanner for assessing in-store produce quality with instant fruit condition feedback
- Offers personalized ripeness recommendations based on user preferences

### AI-Powered Fruit Insight Assistant
- Provides users with AI-driven insights on fruit quality, nutritional value, and best consumption practices
- Suggests recipes, storage tips, and ways to minimize waste based on the fruit's ripeness level

## Features

- **Fruit Ripeness Scanning**: Scan fruits using your device camera to determine ripeness levels
- **Dashboard**: View summary statistics and insights about your scanned items
- **Grocery Integration**: Get suggestions for grocery shopping based on ripeness needs
- **History Tracking**: Keep track of previously scanned items and their ripeness progression
- **User Authentication**: Secure login and signup functionality

## Technology Stack

- **Frontend**: React.js with JSX
- **Styling**: CSS with Tailwind CSS integration
- **Backend Configuration**: Firebase for authentication and data storage
- **ML Model**: MobileNetV2-based dual-output fruit ripeness classifier
- **Build Tool**: Vite

## Project Structure

```
RIPE-ROBOTICS-AI/
├── node_modules/
├── public/
├── src/
│   ├── assets/
│   ├── context/
│   │   └── UserContext.jsx
│   ├── Model/
│   │   └── fruit_ripeness_classifier_final.keras
│   ├── screens/
│   │   ├── AuthScreen.jsx
│   │   ├── Dashboard.jsx
│   │   ├── GroceryScreen.jsx
│   │   ├── HistoryScreen.jsx
│   │   ├── Insight.jsx
│   │   ├── LoginScreen.jsx
│   │   ├── MainHome.jsx
│   │   ├── ScanScreen.jsx
│   │   ├── SignupScreen.jsx
│   │   └── Splash.jsx
│   ├── App.css
│   ├── App.jsx
│   ├── firebaseConfig.js
│   ├── index.css
│   └── main.jsx
├── .env
├── .gitignore
├── eslint.config.js
├── index.html
├── Model_Usage.txt
├── package-lock.json
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
└── vite.config.js
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/RIPE-ROBOTICS-AI.git
   cd RIPE-ROBOTICS-AI
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the necessary environment variables (see `.env.example` for reference)

4. Start the development server:
   ```
   npm run dev
   ```

## Model Usage

Please refer to [Model_Usage.txt](./Model_Usage.txt) for detailed instructions on how to use the fruit ripeness classifier model.

## Model Fruits
Apple, Dragon, Lemon, Orange, Pineapple, Strawberry, Banana, Grapes, Mango, Papaya, Pomegranate


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
