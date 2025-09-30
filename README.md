# Prefiller - AI-Powered Form Filling Extension

An intelligent Chrome extension that uses Google Gemini AI to automatically fill forms based on your personal documents and context.

## Features

- 🤖 **AI-Powered Form Filling**: Uses Google Gemini API to generate contextually appropriate responses
- 📄 **Document Upload**: Upload personal documents (TXT, PDF, DOC, DOCX) to provide context
- 🔍 **Smart Form Detection**: Automatically detects and analyzes form fields on any webpage
- ✨ **Intelligent Responses**: Generates professional, relevant responses based on your documents
- 🎨 **Modern UI**: Built with Preact and Tailwind CSS for a clean, responsive interface
- 🔒 **Privacy-Focused**: Your documents and API key are stored locally in your browser

## Setup

### Prerequisites

- Node.js (v16 or higher)
- Chrome browser
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

3. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Configuration

1. **Set up API Key:**
   - Click the Prefiller extension icon in your toolbar
   - Enter your Google Gemini API key
   - Click "Save"

2. **Upload Documents:**
   - In the extension popup, drag and drop your personal documents
   - Supported formats: TXT, PDF, DOC, DOCX
   - These documents provide context for form filling

## Usage

1. **Navigate to a webpage with forms**
2. **Click the extension icon** or let it auto-analyze the page
3. **Click "Analyze Page"** to detect form fields
4. **Click "Fill Forms"** to automatically fill detected fields with AI-generated responses

### Manual Form Filling

- Click "Analyze Page" to highlight detected form fields
- Click "Fill Forms" to populate them with personalized content
- Review and modify the filled content as needed

## Development

### Project Structure

```
src/
├── popup/          # Extension popup UI
├── content/        # Content script for form detection
├── background/     # Background service worker
├── components/     # Reusable UI components
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

### Build Commands

- `npm run dev` - Development mode with hot reload
- `npm run build` - Production build
- `npm run preview` - Preview the built extension

### Technologies Used

- **Preact** - Lightweight React alternative for UI
- **TypeScript** - Type safety and better development experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Chrome Extensions API** - Browser integration

## Privacy & Security

- API keys are stored locally in Chrome's sync storage
- Documents are processed locally and sent only to Google's Gemini API
- No data is stored on external servers
- Follows Chrome extension security best practices

## Troubleshooting

### Common Issues

1. **"No forms detected"**
   - Make sure the page has visible input fields
   - Try refreshing the page and analyzing again

2. **"API key error"**
   - Verify your Gemini API key is correct
   - Check that your API key has proper permissions

3. **Forms not filling**
   - Ensure you have uploaded relevant documents
   - Check that the extension is enabled
   - Try analyzing the page first

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key and documents are properly configured
3. Try disabling and re-enabling the extension

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.