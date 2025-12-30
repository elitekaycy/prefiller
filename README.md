<div align="center">

# 🚀 Prefiller

### AI-Powered Form Filling Chrome Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://github.com/elitekaycy/prefiller)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Preact](https://img.shields.io/badge/Preact-673AB8?logo=preact&logoColor=white)](https://preactjs.com/)

**Automatically fill web forms with AI-powered intelligence using your personal documents**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Contributing](#-contributing) • [License](#-license)

</div>

---

## 📖 About

Prefiller is an intelligent Chrome extension that leverages AI to automatically fill web forms based on your personal documents and context. Upload your CV, cover letter, or any relevant documents, and let AI understand your background to fill forms accurately and contextually.

Perfect for job applications, surveys, registration forms, and any repetitive form-filling tasks!

## ✨ Features

### 🤖 **AI-Powered Intelligence**
- **Multiple AI Providers**: Choose from Groq (recommended & FREE), Google Gemini, Anthropic Claude, or Chrome AI
- **Context-Aware Responses**: Generates personalized, professional responses based on your documents
- **Smart Field Detection**: Automatically identifies and categorizes form fields
- **Multi-Line Response Support**: Handles complex, multi-paragraph responses seamlessly

### 📄 **Document Management**
- **Multi-Format Support**: Upload TXT, PDF, DOC, DOCX files
- **Intelligent Parsing**: Extracts and analyzes text from your documents
- **Local Storage**: Your documents stay private and secure in your browser

### 🎨 **User Experience**
- **Modern, Clean UI**: Built with Preact and Tailwind CSS
- **Real-Time Feedback**: Toast notifications with status updates
- **Easy Configuration**: Simple setup wizard for AI providers and documents
- **Developer Mode**: Comprehensive logging for debugging

### 🔒 **Privacy & Security**
- **Local-First**: All data stored locally in Chrome storage
- **Encrypted API Keys**: Secure storage of your API credentials
- **No External Servers**: Direct communication with AI providers only
- **Open Source**: Full transparency and community-driven development

## 🚀 Installation

### Prerequisites

- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **Chrome Browser** ([Download](https://www.google.com/chrome/))
- **AI API Key** (choose one):
  - [Groq API Key](https://console.groq.com/keys) - **FREE & Recommended** ⭐
  - [Google Gemini API Key](https://aistudio.google.com/app/apikey) - FREE tier available
  - [Anthropic Claude API Key](https://console.anthropic.com/account/keys) - Paid
  - Chrome AI (Built-in) - Experimental, requires Chrome flags

### Build from Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/elitekaycy/prefiller.git
   cd prefiller
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (top right toggle)
   - Click **Load unpacked**
   - Select the `dist` folder from the project directory

## 📘 Usage

### Initial Setup

1. **Click the Prefiller icon** in your Chrome toolbar
2. **Choose your AI provider**:
   - **Groq** (Recommended) - Fast, free, and powerful
   - **Google Gemini** - Reliable with free tier
   - **Anthropic Claude** - Advanced reasoning (testing mode)
   - **Chrome AI** - Local, experimental

3. **Configure API Key** (skip for Chrome AI):
   - Enter your API key
   - Click **Verify & Connect**
   - Wait for successful connection confirmation

4. **Upload your documents**:
   - Drag and drop or click to upload
   - Supported formats: PDF, TXT, DOC, DOCX
   - Upload CV, cover letters, portfolios, etc.

### Filling Forms

1. **Navigate to any webpage with forms** (job applications, surveys, etc.)
2. **Click the Prefiller extension icon**
3. **Click "Analyze & Fill Forms"**
4. **Review and edit** the AI-filled content as needed
5. **Submit your form** with confidence!

### Tips for Best Results

- **Upload comprehensive documents**: Include detailed CVs, cover letters, and portfolios
- **Use Groq for speed**: Best balance of speed, accuracy, and free usage
- **Review AI responses**: Always verify AI-generated content before submission
- **Keep documents updated**: Refresh your uploaded documents regularly

## 🛠️ Development

### Project Structure

```
prefiller/
├── src/
│   ├── popup/              # Extension popup UI (Preact)
│   ├── content/            # Content scripts for form detection
│   │   ├── content-bundled.ts   # Main form filling logic
│   │   └── scraper.ts           # Form field scraper
│   ├── background/         # Service worker
│   ├── components/         # Reusable UI components
│   ├── utils/              # Utility functions
│   │   ├── aiService.ts         # AI provider abstraction
│   │   ├── gemini.ts            # Gemini API client
│   │   ├── groq.ts              # Groq API client
│   │   └── documentParser.ts   # Document parsing
│   ├── storage/            # Chrome storage management
│   ├── types/              # TypeScript type definitions
│   └── config/             # Configuration and constants
├── public/                 # Static assets
├── dist/                   # Build output (generated)
└── manifest.json           # Chrome extension manifest
```

### Available Scripts

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build

# Preview built extension
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

### Tech Stack

| Technology | Purpose |
|------------|---------|
| **Preact** | Lightweight React alternative for UI |
| **TypeScript** | Type safety and better DX |
| **Vite** | Fast build tool and dev server |
| **Tailwind CSS** | Utility-first styling |
| **Chrome Extensions API** | Browser integration |
| **AI APIs** | Groq, Gemini, Claude for intelligence |

## 🤝 Contributing

Contributions are welcome and appreciated! Here's how you can help:

### Ways to Contribute

- 🐛 **Report bugs** by opening an issue
- 💡 **Suggest features** or enhancements
- 📝 **Improve documentation**
- 🔧 **Submit pull requests** with fixes or features
- ⭐ **Star the repository** to show support

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes** and commit
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request** with a clear description

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## 🐛 Troubleshooting

### Common Issues

<details>
<summary><b>❌ "No forms detected on this page"</b></summary>

- Ensure the page has visible input fields
- Refresh the page and try again
- Check if fields are inside iframes (not currently supported)
</details>

<details>
<summary><b>❌ "API key validation failed"</b></summary>

- Verify your API key is correct for the selected provider
- Check API key format:
  - Groq: starts with `gsk_`
  - Gemini: starts with `AIzaSy`
  - Claude: starts with `sk-ant-`
- Ensure you have API credits/quota available
</details>

<details>
<summary><b>❌ "Gemini fails to connect"</b></summary>

- The extension uses Gemini 2.5 Flash (latest model)
- Ensure your API key is active and has quota
- Check Google AI Studio for any service disruptions
</details>

<details>
<summary><b>❌ Forms are partially filled</b></summary>

- Upload more comprehensive documents
- Try using Groq for better accuracy
- Review the form field labels - AI needs clear context
</details>

### Getting Help

- **Check Console**: Open DevTools → Console for error messages
- **Open an Issue**: [GitHub Issues](https://github.com/elitekaycy/prefiller/issues)
- **Discussions**: [GitHub Discussions](https://github.com/elitekaycy/prefiller/discussions)

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude API
- [Google](https://ai.google.dev/) for Gemini API
- [Groq](https://groq.com/) for lightning-fast inference
- [Chrome Extensions](https://developer.chrome.com/docs/extensions/) documentation
- All contributors and supporters of this project

## 📬 Contact & Support

- **Author**: [@elitekaycy](https://github.com/elitekaycy)
- **Repository**: [github.com/elitekaycy/prefiller](https://github.com/elitekaycy/prefiller)
- **Issues**: [Report a bug or request a feature](https://github.com/elitekaycy/prefiller/issues)

---

<div align="center">

**Made with ❤️ by the open-source community**

⭐ **Star this repo** if you find it helpful!

</div>
