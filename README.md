# Spraystone Facade Simulator

An AI-powered facade transformation simulator that helps users visualize and get professional recommendations for their facade renovation projects.

## Features

- 📋 **Comprehensive Form**: Collect all necessary information about the facade
- 🖼️ **Image Upload**: Upload current facade photos for analysis
- 🤖 **AI Analysis**: Google Gemini AI provides detailed facade assessment
- 💡 **Smart Recommendations**: Get personalized treatment and finish suggestions
- 💰 **Cost Estimation**: Receive accurate price estimates
- 📱 **Responsive Design**: Works on all devices
- 🎨 **Modern UI**: Beautiful, intuitive interface with Tailwind CSS

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## How It Works

1. **User Input**: Users fill out a comprehensive form with:
   - Building address
   - Facade type and condition
   - Surface area
   - Desired finish
   - Additional treatments
   - Contact information

2. **Image Upload**: Users upload a photo of their current facade

3. **AI Analysis**: The system sends the form data and image to Google Gemini AI with a detailed prompt

4. **Results**: Users receive:
   - Detailed facade assessment
   - Visual transformation description
   - Technical recommendations
   - Cost estimation
   - Project timeline
   - Before/after visualization guide

## API Configuration

The application uses Google Gemini AI API. The API key is configured in `src/App.jsx`:

```javascript
const API_KEY = 'AIzaSyAp9YycbuOYCwmrq88Q9_mTOEz--e_z7pQ';
```

⚠️ **Security Note**: For production, move the API key to environment variables.

## Technologies Used

- **React 18**: UI framework
- **Vite**: Build tool
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Google Generative AI**: AI analysis
- **Modern JavaScript**: ES6+ features

## Project Structure

```
facade-simulator/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── tailwind.config.js   # Tailwind configuration
```

## Super Prompt

The application uses a comprehensive "super prompt" that provides the AI with:
- All collected user data
- Specific instructions for facade analysis
- Structured output requirements
- Professional consultation guidelines

The prompt ensures consistent, high-quality responses that address:
- Facade assessment
- Visual transformation details
- Technical recommendations
- Cost estimation
- Timeline planning
- Visualization guidance

## Future Enhancements

- Save quotes to database
- Email report to users
- CRM integration
- Multi-language support
- Enhanced before/after image generation
- Mobile app version

## License

Private - Spraystone Internal Use
