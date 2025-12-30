# Accessibility Testing Guide - WCAG 2.1 AA Compliance

## Overview
This guide provides instructions for testing the Prefiller Chrome Extension's accessibility compliance with WCAG 2.1 Level AA standards.

---

## Phase 6: Testing & Validation Checklist

### 1. Automated Testing Tools

#### 1.1 axe DevTools (Chrome Extension)
**Installation:** https://www.deque.com/axe/devtools/

**Steps:**
1. Install axe DevTools browser extension
2. Load the extension popup (`chrome-extension://[your-id]/popup.html`)
3. Open axe DevTools from browser DevTools
4. Run "Scan ALL of my page"
5. Review results:
   - **Target:** Zero critical or serious issues
   - Fix any flagged accessibility violations
   - Document any warnings that are false positives

**Expected Results:**
- ✅ All interactive elements have accessible names
- ✅ All form inputs have associated labels
- ✅ Heading hierarchy is logical (h1 → h2 → h3)
- ✅ ARIA attributes are valid and used correctly
- ✅ Color contrast meets WCAG AA standards

---

#### 1.2 Lighthouse Accessibility Audit

**Steps:**
1. Build the extension: `npm run build`
2. Load extension in Chrome
3. Open Chrome DevTools
4. Go to "Lighthouse" tab
5. Select "Accessibility" category only
6. Run audit on popup page

**Target Score:** 90+ (out of 100)

**Common Issues to Check:**
- Form elements have associated labels
- ARIA attributes are valid
- Color contrast is sufficient
- Interactive elements are keyboard accessible

---

#### 1.3 WAVE Browser Extension

**Installation:** https://wave.webaim.org/extension/

**Steps:**
1. Install WAVE extension
2. Load the Prefiller popup
3. Click WAVE icon to run analysis
4. Review:
   - **Errors:** Should be 0
   - **Alerts:** Review each (some may be informational)
   - **Features:** Verify ARIA usage is correct
   - **Structural Elements:** Verify semantic HTML

---

### 2. Manual Keyboard Navigation Testing

#### 2.1 Provider Selection (Setup Step)
- [ ] **Tab to provider cards:** First card should receive focus
- [ ] **Arrow Down/Right:** Moves to next provider and updates selection
- [ ] **Arrow Up/Left:** Moves to previous provider and updates selection
- [ ] **Enter/Space:** Selects focused provider
- [ ] **Focus indicator:** Visible blue outline on focused card
- [ ] **Tab order:** Logical flow (top to bottom)

#### 2.2 API Key Input
- [ ] **Tab to input:** Input field receives focus
- [ ] **Type API key:** Input accepts text
- [ ] **Tab to toggle visibility:** Eye icon button receives focus
- [ ] **Enter/Space on toggle:** Shows/hides API key
- [ ] **Tab to Connect button:** Button receives focus
- [ ] **Enter on Connect:** Submits and validates API key
- [ ] **Focus on error:** Error message receives focus when validation fails

#### 2.3 Document Upload
- [ ] **Tab to file input:** Browse button receives focus
- [ ] **Enter/Space:** Opens file picker
- [ ] **Tab to document list:** First document receives focus
- [ ] **Delete/Backspace:** Removes focused document
- [ ] **Arrow Down/Up:** Navigates between documents (if multiple)

#### 2.4 Form Actions
- [ ] **Tab to "Analyze & Fill" button:** Button receives focus
- [ ] **Enter/Space:** Triggers form fill action
- [ ] **Tab to Back button:** Back button receives focus
- [ ] **Escape key:** Returns to previous step

#### 2.5 Global Navigation
- [ ] **Escape key:** Goes back to previous step from any screen
- [ ] **Skip to main content:** Tab on page load shows skip link
- [ ] **No keyboard traps:** Can always tab/escape out of any section
- [ ] **Focus visible:** All interactive elements show clear focus indicator

---

### 3. Screen Reader Testing

#### 3.1 Recommended Screen Readers
- **NVDA (Windows):** https://www.nvaccess.org/download/ (Free)
- **JAWS (Windows):** Commercial, widely used
- **VoiceOver (macOS):** Built-in (Cmd+F5)

#### 3.2 Testing Checklist with NVDA/JAWS/VoiceOver

**Setup Step:**
- [ ] Main heading announced: "Prefiller - AI Form Auto-Fill Extension"
- [ ] Step heading announced: "Choose AI Provider"
- [ ] Provider selection announced as radio group
- [ ] Each provider card reads: "Groq - Recommended provider for fast, reliable AI processing, radio button, not checked/checked"
- [ ] Arrow keys navigate providers with clear announcements
- [ ] API key input label read: "API Key, required, edit text"
- [ ] Error messages announced assertively when shown
- [ ] Success messages announced politely

**Document Upload Step:**
- [ ] Heading announced: "Upload Documents"
- [ ] File input label read clearly
- [ ] Upload progress announced: "Processing document..."
- [ ] Document list announced: "Uploaded Documents (2)"
- [ ] Each document read with name and upload date
- [ ] Remove button announced: "Remove resume.pdf"

**Form Actions Step:**
- [ ] Status cards announce: "AI Provider: Connected" / "Documents: Loaded"
- [ ] "Analyze & Fill Forms" button announced with full description
- [ ] Loading state announced: "Processing form fill request. Please wait."
- [ ] Button text updates announced: "Processing..."

**Toast Notifications:**
- [ ] Success toasts announced politely
- [ ] Error toasts announced assertively

---

### 4. Focus Management Testing

#### 4.1 Step Changes
- [ ] When moving to new step, focus moves to first heading (h2)
- [ ] User can continue navigation from heading with Tab

#### 4.2 Error States
- [ ] When API key validation fails, focus moves to error message
- [ ] User can read error and tab to retry action
- [ ] Error message is focusable (tabindex="-1")

#### 4.3 Loading States
- [ ] When form fill starts, screen reader announces loading
- [ ] Focus remains on button during processing
- [ ] Button text updates to "Processing..."

---

### 5. Semantic HTML Validation

#### 5.1 Heading Structure
- [ ] One `<h1>` per page: "Prefiller - AI Form Auto-Fill Extension" (sr-only)
- [ ] Logical hierarchy: h1 → h2 → h3 (no skipped levels)
- [ ] Each step has an h2 heading
- [ ] Subsections use h3 headings

#### 5.2 Form Elements
- [ ] All inputs have associated `<label>` elements
- [ ] Labels use `for` attribute matching input `id`
- [ ] Required fields marked with `aria-required="true"`
- [ ] Invalid fields marked with `aria-invalid="true"`
- [ ] Error messages linked via `aria-describedby`

#### 5.3 Interactive Elements
- [ ] Buttons use `<button>` elements (not divs with onClick)
- [ ] Links use `<a>` elements
- [ ] Custom radio buttons use `role="radio"` and `role="radiogroup"`
- [ ] Lists use `<ul>/<ol>` and `<li>` elements

#### 5.4 Landmarks
- [ ] Main content in `<main>` element
- [ ] Skip to main content link present
- [ ] Regions have descriptive `aria-labelledby` attributes

---

### 6. ARIA Attributes Validation

#### 6.1 Provider Selection
```html
<div role="radiogroup" aria-labelledby="provider-selection-heading">
  <button role="radio" aria-checked="true/false" aria-label="[Provider description]">
```
- [ ] Radiogroup contains all provider buttons
- [ ] Each button has role="radio"
- [ ] aria-checked reflects current selection
- [ ] aria-label provides full context

#### 6.2 Form Inputs
```html
<input aria-required="true" aria-invalid="false" aria-describedby="api-key-help">
<span id="api-key-help" class="sr-only">Help text</span>
```
- [ ] Required inputs have `aria-required="true"`
- [ ] Invalid inputs have `aria-invalid="true"`
- [ ] Help text linked via `aria-describedby`

#### 6.3 Dynamic Content
```html
<div role="alert" aria-live="assertive">Error message</div>
<div role="status" aria-live="polite">Success message</div>
```
- [ ] Errors use `role="alert"` and `aria-live="assertive"`
- [ ] Status updates use `aria-live="polite"`
- [ ] Loading states use `aria-busy="true"`

#### 6.4 Buttons and Actions
```html
<button aria-label="Analyze page and fill forms" aria-busy="false">
```
- [ ] Descriptive aria-labels on icon-only buttons
- [ ] aria-busy reflects loading state
- [ ] aria-pressed on toggle buttons (show/hide password)

---

### 7. Visual Focus Indicators

#### 7.1 Focus Styles
- [ ] All interactive elements show visible focus indicator
- [ ] Focus indicator has 3:1 contrast ratio with background
- [ ] Focus indicator is at least 3px wide
- [ ] Outline offset prevents overlap with content

**Expected CSS:**
```css
:focus-visible {
  outline: 3px solid var(--gemini-accent);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(138, 180, 248, 0.2);
}
```

#### 7.2 Focus Order
- [ ] Tab order follows visual order (top to bottom, left to right)
- [ ] No unexpected focus jumps
- [ ] All interactive elements reachable via keyboard

---

### 8. WCAG 2.1 Level AA Compliance Checklist

| Criterion | Level | Requirement | Status |
|-----------|-------|-------------|--------|
| **1.3.1 Info and Relationships** | A | Information, structure, and relationships can be programmatically determined | ✅ Semantic HTML + ARIA |
| **1.3.2 Meaningful Sequence** | A | Correct reading sequence can be programmatically determined | ✅ Logical DOM order |
| **2.1.1 Keyboard** | A | All functionality available via keyboard | ✅ Full keyboard support |
| **2.1.2 No Keyboard Trap** | A | Keyboard focus can be moved away from any component | ✅ Escape key + Tab |
| **2.4.1 Bypass Blocks** | A | Mechanism to skip repeated blocks of content | ✅ Skip to main content |
| **2.4.3 Focus Order** | A | Focusable components receive focus in logical order | ✅ Tab order matches visual |
| **2.4.6 Headings and Labels** | AA | Headings and labels describe topic or purpose | ✅ Descriptive headings/labels |
| **2.4.7 Focus Visible** | AA | Keyboard focus indicator is visible | ✅ 3px blue outline |
| **3.2.1 On Focus** | A | Component does not initiate change of context on focus | ✅ No auto-submit |
| **3.2.2 On Input** | A | Changing setting does not automatically cause change of context | ✅ Explicit actions required |
| **3.2.4 Consistent Identification** | AA | Components with same functionality identified consistently | ✅ Consistent patterns |
| **3.3.1 Error Identification** | A | Input errors are identified and described to user | ✅ Error messages + ARIA |
| **3.3.2 Labels or Instructions** | A | Labels or instructions provided for user input | ✅ All inputs labeled |
| **4.1.2 Name, Role, Value** | A | For all UI components, name and role can be determined | ✅ ARIA on custom components |
| **4.1.3 Status Messages** | AA | Status messages can be determined without receiving focus | ✅ ARIA live regions |

---

### 9. Color Contrast Testing

**Tool:** Use Chrome DevTools or WebAIM Contrast Checker

**Requirements (WCAG AA):**
- Normal text (< 18pt): 4.5:1 contrast ratio
- Large text (≥ 18pt): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**Elements to Check:**
- [ ] Primary text on background
- [ ] Secondary text on background
- [ ] Button text on button background
- [ ] Focus indicator on any background
- [ ] Error text on error background
- [ ] Link text on background

---

### 10. Responsive and Zoom Testing

- [ ] **Zoom to 200%:** All content remains visible and usable
- [ ] **Zoom to 400%:** Text reflows without horizontal scrolling
- [ ] **Text spacing:** Can increase line height, letter spacing without breaking layout
- [ ] **Small viewport:** Extension popup works on minimum supported browser size

---

## Testing Results Template

Create a testing report with the following structure:

```markdown
# Accessibility Testing Report - Prefiller Extension

**Date:** [Date]
**Tester:** [Name]
**WCAG Level Target:** AA

## Automated Testing

### axe DevTools
- **Critical Issues:** 0
- **Serious Issues:** 0
- **Moderate Issues:** 0
- **Minor Issues:** 0
- **Pass Rate:** 100%

### Lighthouse
- **Accessibility Score:** 95/100
- **Issues:** [List any issues]

### WAVE
- **Errors:** 0
- **Alerts:** 2 (false positives)
- **Features:** 15 ARIA features detected
- **Structural Elements:** Correct

## Manual Testing

### Keyboard Navigation
- [x] All features accessible via keyboard
- [x] Focus visible on all interactive elements
- [x] No keyboard traps
- [x] Logical tab order

### Screen Reader (NVDA/JAWS/VoiceOver)
- [x] All content announced correctly
- [x] Form labels read properly
- [x] Error messages announced
- [x] Dynamic updates announced

### Focus Management
- [x] Focus moves to headings on step change
- [x] Error messages receive focus
- [x] Loading states announced

## WCAG 2.1 AA Compliance
**Result:** ✅ PASS (All criteria met)

## Recommendations
[Any suggestions for improvement]

## Conclusion
The Prefiller extension meets WCAG 2.1 Level AA standards.
```

---

## Common Issues and Fixes

### Issue: axe flags "Elements must have sufficient color contrast"
**Fix:** Update CSS custom properties to ensure 4.5:1 ratio for text, 3:1 for UI components

### Issue: Lighthouse reports "Form elements do not have associated labels"
**Fix:** Ensure every `<input>` has a `<label>` with matching `for` attribute

### Issue: Screen reader doesn't announce dynamic content
**Fix:** Add `aria-live="polite"` or `aria-live="assertive"` to regions with dynamic updates

### Issue: Keyboard focus not visible
**Fix:** Ensure `:focus-visible` styles are applied with sufficient contrast

### Issue: Heading hierarchy skips levels
**Fix:** Use h1 → h2 → h3 without skipping (never h1 → h3)

---

## Resources

- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/
- **WebAIM WCAG Checklist:** https://webaim.org/standards/wcag/checklist
- **axe DevTools:** https://www.deque.com/axe/devtools/
- **WAVE Extension:** https://wave.webaim.org/extension/
- **NVDA Screen Reader:** https://www.nvaccess.org/download/
- **Color Contrast Checker:** https://webaim.org/resources/contrastchecker/

---

## Next Steps

1. Install automated testing tools (axe, WAVE)
2. Run each test from this checklist
3. Document results in testing report
4. Fix any issues discovered
5. Re-test until all criteria pass
6. Create final accessibility compliance report

---

**Status:** Phase 1-5 Complete | Phase 6 In Progress
**Last Updated:** [Current Date]
