# Contributing to Prefiller

Thank you for your interest in contributing to Prefiller! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [How to Contribute](#how-to-contribute)
5. [Coding Standards](#coding-standards)
6. [Testing Requirements](#testing-requirements)
7. [Pull Request Process](#pull-request-process)
8. [Issue Guidelines](#issue-guidelines)
9. [Accessibility Requirements](#accessibility-requirements)
10. [Security Guidelines](#security-guidelines)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:
- Experience level
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Race or ethnicity
- Age
- Religion
- Nationality

### Expected Behavior

- ✅ Be respectful and constructive in discussions
- ✅ Accept feedback gracefully
- ✅ Focus on what's best for the project
- ✅ Show empathy toward other contributors
- ✅ Use welcoming and inclusive language

### Unacceptable Behavior

- ❌ Harassment, trolling, or discriminatory comments
- ❌ Personal attacks or insults
- ❌ Publishing others' private information
- ❌ Spam or promotional content
- ❌ Any conduct that would be inappropriate in a professional setting

### Enforcement

Violations may result in warnings, temporary bans, or permanent removal from the project. Report violations to [your email].

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js 16+ installed
- npm 7+ installed
- Git installed
- Google Chrome browser
- Basic knowledge of TypeScript/JavaScript
- Familiarity with Preact or React

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/prefiller.git
   cd prefiller
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/[original-repo]/prefiller.git
   ```

---

## Development Setup

### Installation

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Watch for changes (development mode)
npm run dev
```

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist` folder from your project directory
5. The extension should now appear in your extensions list

### Development Workflow

```bash
# Make changes to source files in src/

# Build and test
npm run build

# Reload extension in Chrome (click reload button in chrome://extensions)

# Test your changes
```

---

## How to Contribute

### Types of Contributions

We welcome:
- 🐛 **Bug fixes** - Fix broken functionality
- ✨ **New features** - Add useful new capabilities
- 📝 **Documentation** - Improve README, guides, or code comments
- ♿ **Accessibility** - Enhance WCAG compliance
- 🎨 **UI/UX improvements** - Better design or user experience
- ⚡ **Performance optimizations** - Make things faster
- 🧪 **Tests** - Add or improve test coverage
- 🌍 **Translations** - Add multi-language support

### Good First Issues

Look for issues labeled `good-first-issue` if you're new to the project. These are smaller, well-defined tasks suitable for beginners.

---

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Provide proper type annotations
- Avoid `any` types - use specific types or `unknown`
- Use interfaces for object shapes

**Example:**
```typescript
// Good
interface DocumentData {
  id: string;
  name: string;
  uploadedAt: number;
}

// Bad
const processDocument = (doc: any) => { ... }
```

### Naming Conventions

- **Files:** camelCase for utilities, PascalCase for components
  - `src/utils/accessibility.ts` ✅
  - `src/components/AISetup.tsx` ✅
- **Variables/Functions:** camelCase
  - `const handleSubmit = () => {}` ✅
- **Components:** PascalCase
  - `export function DocumentUpload() {}` ✅
- **Constants:** UPPER_SNAKE_CASE
  - `const API_KEY_URLS = {}` ✅

### Code Style

- **Indentation:** 2 spaces (configured in .editorconfig)
- **Quotes:** Single quotes for strings
- **Semicolons:** Required
- **Max line length:** 120 characters
- **Trailing commas:** Yes (for multi-line)

### Comments

- Write self-documenting code when possible
- Add comments for complex logic or non-obvious decisions
- Use JSDoc for public functions and components

**Example:**
```typescript
/**
 * Dynamically loads an AI provider implementation
 * @param provider - The AI provider type to load
 * @param apiKey - The API key for authentication
 * @returns Promise that resolves when provider is loaded
 */
async function loadProvider(provider: AIProvider, apiKey: string): Promise<void> {
  // Implementation
}
```

---

## Testing Requirements

### Current State

⚠️ **We currently have no automated tests.** This is a known gap we're working to address.

### Testing Before PR

Until automated tests are added, please manually test:

1. **Build successfully:**
   ```bash
   npm run build
   # Should complete with no errors
   ```

2. **Load in Chrome:**
   - Load unpacked extension
   - No console errors

3. **Basic functionality:**
   - Setup flow works (API key entry)
   - Document upload works
   - Form filling works on test page

4. **Accessibility (if UI changes):**
   - Test keyboard navigation
   - Verify focus indicators visible
   - Check ARIA labels present

5. **Cross-provider (if AI changes):**
   - Test with Groq
   - Test with Gemini
   - Test with Claude
   - Test with Chrome AI (if available)

### Future: Automated Tests

We plan to add:
- Unit tests (Jest/Vitest)
- Integration tests
- E2E tests
- Accessibility tests (jest-axe)

If you'd like to help set this up, please open an issue!

---

## Pull Request Process

### Before Submitting

1. **Create a new branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes:**
   - Follow coding standards
   - Test thoroughly
   - Update documentation if needed

3. **Commit with clear messages:**
   ```bash
   git commit -m "feat: add document preview feature"
   # or
   git commit -m "fix: correct API key validation for Gemini"
   ```

   **Commit message format:**
   - `feat: description` - New feature
   - `fix: description` - Bug fix
   - `docs: description` - Documentation only
   - `style: description` - Code style changes (formatting)
   - `refactor: description` - Code refactoring
   - `perf: description` - Performance improvement
   - `test: description` - Adding tests
   - `chore: description` - Build/tooling changes

4. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

### Submitting PR

1. **Open Pull Request** on GitHub
2. **Fill out PR template** (if provided)
3. **Describe your changes** clearly
4. **Link related issues** using `Fixes #123` or `Relates to #456`
5. **Request review** from maintainers

### PR Requirements

Your PR must:
- ✅ Build successfully (`npm run build`)
- ✅ Follow coding standards
- ✅ Include clear description of changes
- ✅ Update documentation if needed
- ✅ Not introduce new accessibility issues
- ✅ Not include hardcoded API keys or secrets

### Review Process

1. Maintainer(s) will review your PR
2. You may receive feedback or change requests
3. Address feedback by pushing new commits
4. Once approved, maintainer will merge

### After Merge

- Your contribution will be included in the next release
- You'll be added to contributors list (if desired)
- Thank you! 🎉

---

## Issue Guidelines

### Before Opening an Issue

1. **Search existing issues** - Your issue may already exist
2. **Check documentation** - Question might be answered in README
3. **Try latest version** - Bug might already be fixed

### Bug Reports

When reporting bugs, include:

```markdown
**Description:**
Clear description of the bug

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots:**
If applicable

**Environment:**
- Chrome version: X.X.X
- Extension version: X.X.X
- AI provider: Groq/Gemini/Claude/Chrome AI
- Operating System: Windows/Mac/Linux
```

### Feature Requests

When requesting features, include:

```markdown
**Problem:**
What problem does this solve?

**Proposed Solution:**
How would you like it to work?

**Alternatives Considered:**
Other solutions you've thought about

**Use Case:**
Who would benefit? How would they use it?
```

### Issue Labels

We use labels to categorize issues:
- `bug` - Something isn't working
- `enhancement` - New feature or improvement
- `documentation` - Docs improvements
- `good-first-issue` - Good for newcomers
- `help-wanted` - Extra attention needed
- `accessibility` - A11y related
- `security` - Security related
- `wontfix` - Not planned

---

## Accessibility Requirements

Prefiller complies with WCAG 2.1 Level AA standards. All contributions must maintain this compliance.

### Accessibility Checklist

When contributing UI changes:

- ✅ **Keyboard navigation:** All interactive elements accessible via keyboard
- ✅ **Focus indicators:** Visible focus outlines on all focusable elements
- ✅ **ARIA labels:** Descriptive labels on buttons, inputs, and interactive elements
- ✅ **Semantic HTML:** Use proper HTML5 elements (`<button>`, `<main>`, `<h1-h6>`)
- ✅ **Heading hierarchy:** Logical order (h1 → h2 → h3, no skipping)
- ✅ **Alt text:** Images have descriptive alt text
- ✅ **Color contrast:** 4.5:1 ratio for normal text, 3:1 for large text
- ✅ **Screen reader testing:** Test with NVDA, JAWS, or VoiceOver

### Testing Accessibility

1. **Automated tools:**
   - Run Lighthouse accessibility audit (score should be 90+)
   - Use axe DevTools browser extension
   - Use WAVE browser extension

2. **Manual testing:**
   - Navigate with Tab key only (no mouse)
   - Test with screen reader
   - Verify focus is always visible
   - Check all interactive elements have labels

See `ACCESSIBILITY_TESTING.md` for complete guide.

---

## Security Guidelines

### Reporting Security Issues

**Do NOT open public issues for security vulnerabilities.**

Instead:
1. Email: [your-security-email@example.com]
2. Include detailed description
3. Steps to reproduce
4. Impact assessment

We will respond within 48 hours.

### Security Best Practices

When contributing:
- ❌ Never commit API keys or secrets
- ❌ Don't use `eval()` or `new Function()`
- ❌ Avoid `innerHTML` (use `textContent` or DOM methods)
- ✅ Use CSP-compliant code
- ✅ Validate all user inputs
- ✅ Sanitize data before rendering
- ✅ Use HTTPS for all API calls

### Sensitive Data

- API keys must be encrypted (AES-256)
- Never log sensitive information
- Don't send data to external servers (except AI providers)

---

## Documentation

### When to Update Docs

Update documentation when you:
- Add new features
- Change existing behavior
- Fix bugs that affect usage
- Add new AI provider support
- Change configuration options

### Documentation Files

- `README.md` - Overview, installation, quick start
- `ACCESSIBILITY_TESTING.md` - Accessibility testing guide
- `ACCESSIBILITY_SUMMARY.md` - A11y implementation details
- `IMPLEMENTATION_STATUS.md` - Project status and roadmap
- `PRIVACY_POLICY.md` - Privacy policy
- `TERMS_OF_SERVICE.md` - Terms of service
- Code comments - Inline documentation

---

## Questions?

If you have questions about contributing:

1. **Check existing documentation** - README, IMPLEMENTATION_STATUS.md
2. **Search closed issues** - Question might be answered
3. **Open a discussion** - Use GitHub Discussions (if enabled)
4. **Open an issue** - Label it as "question"
5. **Email maintainers** - [your-email@example.com]

---

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- CONTRIBUTORS.md file (if we create one)
- Release notes (for significant contributions)

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project ([Your License - e.g., MIT]).

---

## Thank You!

Thank you for contributing to Prefiller! Every contribution, no matter how small, helps make the project better for everyone.

Happy coding! 🚀
