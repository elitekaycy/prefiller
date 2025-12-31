# Changelog

All notable changes to Prefiller will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned Features
- Automated testing suite (unit, integration, E2E)
- Form field confidence scores
- Custom field mapping per website
- Multi-language support (i18n)
- Advanced document parsing (Excel, CSV, JSON)
- Usage analytics dashboard

---

## [1.0.0] - 2025-12-31

### 🎉 Initial Release

First stable release of Prefiller - AI-powered form auto-fill extension.

### Added

#### Core Features
- **Multi-AI Provider Support**
  - Groq API integration (recommended, fast)
  - Google Gemini API integration
  - Anthropic Claude API integration
  - Chrome AI integration (local, private processing)
  - Easy provider switching via UI

#### Document Processing
- Document upload support (PDF, TXT, DOC, DOCX)
- Local document parsing using PDF.js and other libraries
- Information extraction (name, email, phone, education, work experience)
- Cached parsing for faster subsequent loads
- Document management (add/remove documents)

#### Form Filling
- Intelligent form field detection on any website
- AI-powered field matching and value suggestions
- Review before submit workflow
- Support for text inputs, textareas, selects, and more
- Works in iframes and shadow DOM

#### Security & Privacy
- AES-256 encryption for API keys
- PBKDF2 key derivation (100,000 iterations)
- All data stored locally (Chrome storage API)
- No telemetry or analytics
- No data sent to external servers (except AI providers)
- Open source codebase for transparency

#### Error Handling & Resilience
- Retry logic with exponential backoff
- Configurable max retries per provider (3-5 attempts)
- Request timeout handling (45-120s per provider)
- API rate limiting protection (token bucket algorithm)
- Graceful error messages with user guidance

#### Accessibility (WCAG 2.1 AA Compliant)
- Full keyboard navigation (Tab, Arrow keys, Enter, Escape)
- Visible focus indicators on all interactive elements
- Screen reader support (NVDA, JAWS, VoiceOver)
- ARIA labels and live regions
- Semantic HTML structure
- Roving tabindex for provider selection
- Auto-focus management
- Skip to main content link

#### Performance
- Code splitting with dynamic imports
- 91% bundle size reduction (507 kB → 46 kB)
- Lazy loading for AI providers
- Vendor code chunking
- Fast initial load times (~60 kB)

#### User Experience
- Clean, modern UI with rainbow border
- Three-step workflow (Setup → Documents → Actions)
- Real-time API key validation
- Usage statistics tracking (per provider)
- Toast notifications for feedback
- Loading states and progress indicators
- Error recovery with skip option

#### Developer Experience
- TypeScript for type safety
- Preact for lightweight UI
- Vite for fast builds
- ESLint and code quality tools
- Comprehensive documentation
- Open source with contribution guidelines

### Documentation
- `README.md` - Project overview and installation
- `PRIVACY_POLICY.md` - Comprehensive privacy policy
- `TERMS_OF_SERVICE.md` - Terms of service
- `CONTRIBUTING.md` - Contribution guidelines
- `ACCESSIBILITY_TESTING.md` - A11y testing guide
- `ACCESSIBILITY_SUMMARY.md` - A11y implementation details
- `IMPLEMENTATION_STATUS.md` - Project status and roadmap
- `CHROME_WEB_STORE.md` - Chrome Web Store listing guide
- `CHANGELOG.md` - This file

### Technical Details

#### Dependencies
- Preact: 10.x (lightweight React alternative)
- PDF.js: Document parsing
- React Hot Toast: User notifications
- Web Crypto API: Encryption

#### Architecture
- Strategy pattern for AI providers
- Storage abstraction layer
- Token bucket rate limiter
- Retry logic with jitter
- Dynamic provider loading

#### Browser Permissions
- `storage` - Local data storage
- `activeTab` - Read current tab forms
- `scripting` - Inject form-filling logic
- `host_permissions` - AI API access

#### Bundle Size
- Initial: 46.24 kB (gzip: 13.78 kB)
- Provider chunks: 2.6-10.4 kB each
- Vendor: 19.25 kB (Preact)
- PDF library: 446.21 kB (lazy loaded)

#### Browser Support
- Chrome 88+ (full support)
- Chrome 127+ (Chrome AI support)
- Edge 88+ (Chromium-based)

### Security
- AES-256-GCM encryption for API keys
- Content Security Policy enforcement
- No eval() or unsafe code execution
- HTTPS-only API communications
- Input validation and sanitization

---

## Version History Summary

| Version | Date | Key Changes |
|---------|------|-------------|
| 1.0.0 | 2025-12-31 | Initial release with 4 AI providers, WCAG AA compliance, 91% bundle optimization |

---

## Upgrade Guide

### From Pre-release to 1.0.0
This is the first stable release. If you were testing pre-release versions:
1. Uninstall old version
2. Install 1.0.0
3. Re-enter API keys (encryption method may have changed)
4. Re-upload documents

---

## Breaking Changes

### 1.0.0
None - initial release

---

## Deprecations

### 1.0.0
None - initial release

---

## Known Issues

### 1.0.0
- Chrome AI requires Chrome 127+ and experimental flags enabled
- Some complex form structures may not be detected correctly
- Very large PDFs (>10MB) may parse slowly
- No automated tests yet (manual testing only)

**Workarounds:**
- For Chrome AI: Follow setup instructions in extension
- For complex forms: Manually review and adjust filled values
- For large PDFs: Consider splitting into smaller documents
- For testing: Manual QA on each release

---

## Roadmap

See `IMPLEMENTATION_STATUS.md` for detailed roadmap.

### Next Major Version (2.0.0)
- Automated testing suite
- Form field confidence scores
- Custom field mapping
- Multi-language support

### Future Considerations
- Additional AI providers
- Browser sync for settings
- Form templates library
- Advanced analytics

---

## Contributors

### 1.0.0
- [@elitekaycy](https://github.com/elitekaycy) - Core development

Want to contribute? See `CONTRIBUTING.md`!

---

## Links

- **GitHub:** https://github.com/[your-username]/prefiller
- **Issues:** https://github.com/[your-username]/prefiller/issues
- **Chrome Web Store:** [Coming soon]
- **Privacy Policy:** PRIVACY_POLICY.md
- **Terms:** TERMS_OF_SERVICE.md

---

## Notes

### Versioning Scheme
We use Semantic Versioning (SemVer):
- **MAJOR** (1.x.x) - Incompatible API changes
- **MINOR** (x.1.x) - New features, backwards compatible
- **PATCH** (x.x.1) - Bug fixes, backwards compatible

### Release Frequency
- **Major releases:** Annually or as needed
- **Minor releases:** Quarterly or as features complete
- **Patch releases:** As needed for critical bugs

### Support Policy
- Latest major version: Fully supported
- Previous major version: Security fixes only
- Older versions: Not supported (please upgrade)

---

**Stay Updated:**
- Watch the GitHub repository for releases
- Subscribe to Chrome Web Store updates
- Follow [@your-twitter] for announcements (optional)

---

_Last Updated: 2025-12-31_
