/**
 * Application Configuration Constants
 * Centralized configuration for AI providers, timeouts, colors, and storage keys
 */

/**
 * AI Provider Configuration
 */
export const AI_CONFIG = {
  // Model names for each provider
  GROQ_MODEL: 'llama-3.3-70b-versatile',
  CLAUDE_MODEL: 'claude-3-5-sonnet-20241022',
  GEMINI_MODEL: 'gemini-pro',

  // Default AI generation parameters
  DEFAULT_TEMPERATURE: 0.4,
  DEFAULT_MAX_TOKENS: 1024,
  DEFAULT_TOP_K: 3,
  DEFAULT_TOP_P: 1,
} as const;

/**
 * Timing Configuration
 */
export const TIMEOUTS = {
  // Form analysis delays
  FORM_ANALYSIS_DELAY: 1000,
  TOP_FRAME_DELAY: 5000,
  IFRAME_DELAY: 2000,

  // Notification duration
  NOTIFICATION_DURATION: 5000,
} as const;

/**
 * UI Color Schemes
 */
export const COLORS = {
  LOADING: {
    bg: '#1f2937',
    border: '#3b82f6',
    text: '#fff',
  },
  SUCCESS: {
    bg: '#065f46',
    border: '#10b981',
    text: '#fff',
  },
  ERROR: {
    bg: '#7f1d1d',
    border: '#ef4444',
    text: '#fff',
  },
} as const;

/**
 * Chrome Storage Keys
 */
export const STORAGE_KEYS = {
  SETTINGS: 'settings',
  DOCUMENTS: 'documents',
  CACHE_PREFIX: 'cache_',
} as const;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  GROQ: 'https://api.groq.com/openai/v1/chat/completions',
  CLAUDE: 'https://api.anthropic.com/v1/messages',
  GEMINI: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
} as const;

/**
 * API Key URLs for user guidance
 */
export const API_KEY_URLS = {
  GROQ: 'https://console.groq.com/keys',
  CLAUDE: 'https://console.anthropic.com/account/keys',
  GEMINI: 'https://aistudio.google.com/app/apikey',
  CHROME_AI: 'chrome://flags/#prompt-api-for-gemini-nano',
} as const;

/**
 * Provider Display Names
 */
export const PROVIDER_NAMES = {
  groq: 'Groq',
  claude: 'Anthropic Claude',
  gemini: 'Google Gemini',
  chromeai: 'Chrome AI',
} as const;

/**
 * Provider Descriptions
 */
export const PROVIDER_DESCRIPTIONS = {
  groq: 'Ultra-fast FREE AI powered by Llama 3.3 70B (30 req/min free tier)',
  claude: 'Anthropic\'s helpful, harmless, and honest AI assistant',
  gemini: 'Google\'s advanced AI model with strong reasoning capabilities',
  chromeai: 'Free built-in AI that runs locally in Chrome (Gemini Nano)',
} as const;
