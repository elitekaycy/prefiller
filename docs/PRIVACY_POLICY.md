# Privacy Policy for Prefiller

**Last Updated:** December 31, 2025
**Effective Date:** December 31, 2025

## Introduction

Prefiller ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use the Prefiller Chrome Extension.

**Key Privacy Principles:**
- ✅ **All data stored locally** on your device only
- ✅ **No data collection** or analytics tracking
- ✅ **No third-party sharing** of your information
- ✅ **You control your data** - delete anytime
- ✅ **Transparent operation** - open source code available

---

## Information We Collect

### 1. API Keys (Optional)
**What:** Your AI provider API keys (Groq, Gemini, Claude)
**Why:** Required to authenticate requests to AI services
**Storage:** Encrypted and stored locally in Chrome's storage API
**Access:** Only you and the selected AI provider
**Deletion:** You can delete anytime via extension settings

### 2. Uploaded Documents
**What:** PDF, TXT, DOC, DOCX files you upload
**Why:** To extract information for form filling
**Storage:** Stored locally in Chrome's storage API
**Processing:** Parsed locally using client-side libraries
**Deletion:** You can remove documents anytime via extension UI

### 3. Extension Settings
**What:** Selected AI provider, extension enabled/disabled state
**Why:** To remember your preferences
**Storage:** Stored locally in Chrome's storage API
**Access:** Only you
**Deletion:** Cleared when you uninstall the extension

### 4. Form Data (Temporary)
**What:** Form fields detected on web pages
**Why:** To analyze and fill forms with your document data
**Storage:** Processed in memory only, never persisted
**Retention:** Discarded after form filling completes

---

## What We DO NOT Collect

- ❌ **No analytics or tracking** - We don't track how you use the extension
- ❌ **No usage statistics** - We don't collect metrics or telemetry
- ❌ **No personal information** - Name, email, phone number not collected by us
- ❌ **No browsing history** - We don't track which websites you visit
- ❌ **No form data storage** - Form information is processed in memory only
- ❌ **No cookies** - We don't set any tracking cookies
- ❌ **No server uploads** - No data is sent to our servers (we don't have servers!)

---

## How We Use Your Information

### API Keys
- **Purpose:** Authenticate your requests to AI providers (Groq, Gemini, Claude)
- **Usage:** Sent directly from your browser to the AI provider's API
- **Encryption:** Encrypted using Web Crypto API before storage
- **Access:** Only decrypted when making API requests

### Uploaded Documents
- **Purpose:** Extract personal information (name, email, phone, education, etc.)
- **Processing:** Parsed locally in your browser using PDF.js and other libraries
- **Caching:** Parsed data cached locally for faster subsequent loads
- **Usage:** Used to populate form fields when you click "Analyze & Fill Forms"

### Extension Settings
- **Purpose:** Remember your AI provider preference and extension state
- **Usage:** Load correct provider and respect enabled/disabled state
- **Storage:** Stored in Chrome's local storage

---

## Data Storage and Security

### Local Storage Only
All data is stored locally on your device using Chrome's Storage API:
- **chrome.storage.local** - For API keys (encrypted), documents, settings
- **Browser memory** - For temporary form processing

**Important:** We do not have servers. We do not upload your data anywhere except to the AI provider you select.

### Encryption
API keys are encrypted using the Web Crypto API:
- **Algorithm:** AES-GCM (256-bit encryption)
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **Salt:** Randomly generated per encryption
- **Storage:** Encrypted ciphertext stored in Chrome storage

### Access Control
- **Extension only:** Only Prefiller can access its stored data
- **No remote access:** No external parties can access your local data
- **User control:** You can view and delete all stored data anytime

---

## Third-Party Services

### AI Provider APIs
When you use Prefiller, data is sent to the AI provider you selected:

#### Groq (https://groq.com)
- **Data Sent:** Your API key, form field information, document excerpts
- **Purpose:** Generate form fill suggestions
- **Privacy Policy:** https://groq.com/privacy-policy/
- **Your Responsibility:** Review Groq's privacy policy before use

#### Google Gemini (https://ai.google.dev)
- **Data Sent:** Your API key, form field information, document excerpts
- **Purpose:** Generate form fill suggestions
- **Privacy Policy:** https://ai.google.dev/gemini-api/terms
- **Your Responsibility:** Review Google's privacy policy before use

#### Anthropic Claude (https://anthropic.com)
- **Data Sent:** Your API key, form field information, document excerpts
- **Purpose:** Generate form fill suggestions
- **Privacy Policy:** https://www.anthropic.com/legal/privacy
- **Your Responsibility:** Review Anthropic's privacy policy before use

#### Chrome AI (Built-in)
- **Data Sent:** Form field information, document excerpts (stays on device)
- **Purpose:** Generate form fill suggestions using local AI model
- **Privacy:** All processing happens locally on your device
- **Requirements:** Chrome 127+ with AI features enabled

**Important:** By using an AI provider, you are subject to their privacy policy and terms of service. We recommend reviewing their policies before providing your API key.

---

## Data Retention

### How Long We Keep Your Data

| Data Type | Retention Period | User Control |
|-----------|-----------------|--------------|
| **API Keys** | Until you delete them or uninstall | Delete via Settings |
| **Documents** | Until you delete them or uninstall | Delete via Document List |
| **Settings** | Until you uninstall the extension | Reset via Settings |
| **Form Data** | Never stored (memory only) | N/A - Not persisted |

### Uninstalling the Extension
When you uninstall Prefiller, Chrome automatically deletes all stored data including:
- Encrypted API keys
- Uploaded documents
- Extension settings
- Cached parsed data

**Note:** This does NOT delete data from AI provider servers. Contact the AI provider directly to request deletion of your API usage data.

---

## Your Rights and Choices

### Access Your Data
You can view all data stored by Prefiller:
1. Open Chrome DevTools (F12)
2. Go to Application > Storage > Chrome Storage
3. Find "chrome-extension://[prefiller-id]"

### Delete Your Data
You have full control to delete your data:
- **Delete API Key:** Settings > Click trash icon next to provider
- **Delete Documents:** Documents tab > Click delete button per document
- **Delete All:** Uninstall the extension

### Opt-Out of AI Processing
- Don't provide API keys - extension won't function without them
- Use Chrome AI (local processing) for privacy-focused usage
- Toggle extension off when not needed

### Export Your Data
- API keys are encrypted and cannot be exported
- Documents can be re-downloaded from their original source
- No usage data is collected, so there's nothing to export

---

## GDPR Compliance (European Users)

If you are in the European Economic Area (EEA), you have additional rights:

### Legal Basis for Processing
We process your data based on:
- **Consent:** You provide API keys and upload documents voluntarily
- **Legitimate Interest:** Necessary for the extension to function

### Your GDPR Rights
1. **Right to Access:** You can view all stored data via Chrome DevTools
2. **Right to Rectification:** You can edit or update documents/API keys
3. **Right to Erasure:** You can delete data anytime or uninstall
4. **Right to Restrict Processing:** Toggle extension off or revoke permissions
5. **Right to Data Portability:** Re-download documents from original source
6. **Right to Object:** Don't use the extension if you object to processing

### Data Controller
Since all data is stored locally on your device, **you are the data controller**. We (the extension developers) do not have access to your data.

### Data Protection Officer
For privacy concerns, contact: [Your Contact Email - Optional]

---

## Children's Privacy

Prefiller is not intended for use by children under 13 years of age. We do not knowingly collect information from children. If you are a parent or guardian and believe your child has used this extension, please uninstall it from their browser.

---

## California Privacy Rights (CCPA)

If you are a California resident, you have additional rights:

### Information We Collect
As stated above, we collect:
- API keys (encrypted, stored locally)
- Uploaded documents (stored locally)
- Extension settings (stored locally)

### We Do Not Sell Your Data
We **do not sell, rent, or share** your personal information with third parties for monetary or other valuable consideration.

### Your CCPA Rights
1. **Right to Know:** You can view all data via Chrome DevTools
2. **Right to Delete:** You can delete data anytime
3. **Right to Opt-Out of Sale:** Not applicable - we don't sell data

---

## Security Measures

We implement security best practices:

### Technical Safeguards
- ✅ **AES-256 encryption** for API keys
- ✅ **HTTPS only** for API communications
- ✅ **Content Security Policy** to prevent XSS attacks
- ✅ **Secure random** salt generation for encryption
- ✅ **No eval()** or unsafe code execution

### Organizational Safeguards
- ✅ **Open source code** - Transparent and auditable
- ✅ **Regular updates** - Security patches applied promptly
- ✅ **Minimal permissions** - Only request necessary Chrome permissions

### User Responsibilities
- 🔒 **Protect your API keys** - Don't share them publicly
- 🔒 **Use strong browser passwords** - Protect Chrome profile
- 🔒 **Keep Chrome updated** - Security patches are important
- 🔒 **Review permissions** - Understand what the extension can access

---

## Permissions Explanation

Prefiller requests the following Chrome permissions:

| Permission | Why We Need It | What It Does |
|------------|----------------|--------------|
| **storage** | Store API keys, documents, settings | Access Chrome's local storage API |
| **activeTab** | Detect and fill forms on current page | Read form fields on active tab only |
| **scripting** | Inject form-filling logic into pages | Execute content scripts for form detection |
| **Host permissions** | Send requests to AI provider APIs | Make API calls to Groq, Gemini, Claude servers |

**We do NOT request:**
- ❌ **tabs** (would allow seeing all tab URLs)
- ❌ **history** (would allow browsing history access)
- ❌ **cookies** (would allow cookie access)
- ❌ **webRequest** (would allow intercepting network traffic)

---

## Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date.

**How You'll Be Notified:**
- Updated privacy policy published on GitHub
- Version number increment in extension
- (Optional) In-extension notification for major changes

**Your Continued Use:**
Continued use of Prefiller after changes constitutes acceptance of the updated policy.

---

## Data Breach Notification

In the unlikely event of a data breach:

**Scope:** Since all data is stored locally on your device, a breach would require:
1. Unauthorized access to your computer, AND
2. Access to your Chrome profile, AND
3. Ability to decrypt encrypted API keys

**Our Response:**
- Notify users via GitHub repository
- Provide guidance on securing their data
- Release security patch if vulnerability found

**Your Response:**
- Change API keys on provider websites
- Review Chrome security settings
- Update extension to latest version

---

## Contact Us

If you have questions about this Privacy Policy:

- **GitHub Issues:** https://github.com/[your-username]/prefiller/issues
- **Email:** [Your Contact Email - Optional]
- **Response Time:** We aim to respond within 7 business days

---

## Open Source and Transparency

Prefiller is open source software:

- **Source Code:** https://github.com/[your-username]/prefiller
- **License:** [Your License - e.g., MIT, GPL]
- **Audit:** Anyone can review the code to verify our privacy claims
- **Contributions:** Community contributions welcome via pull requests

**Verify Our Claims:**
Don't just trust us - review the code yourself! All data handling logic is open and auditable.

---

## Summary (TL;DR)

✅ **Your data stays on your device** - We don't have servers
✅ **API keys are encrypted** - AES-256 encryption
✅ **Documents stored locally** - In Chrome's storage
✅ **No tracking or analytics** - Zero telemetry
✅ **No data selling** - We don't monetize your data
✅ **You control everything** - Delete data anytime
✅ **Open source** - Code is auditable
✅ **GDPR & CCPA compliant** - Respects your privacy rights

**AI Provider Privacy:**
When you use an AI provider (Groq, Gemini, Claude), your form data and document excerpts are sent to their servers. Review their privacy policies before use. Chrome AI processes everything locally.

---

## Agreement

By installing and using Prefiller, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.

If you do not agree with this policy, please do not use Prefiller.

---

**Prefiller - AI-Powered Form Filling**
Privacy-focused. Secure. Transparent.
