# Testing Guide

This directory contains the test setup and utilities for Prefiller.

---

## Running Tests

### All Tests (Watch Mode)
```bash
npm test
```

### All Tests (Single Run)
```bash
npm run test:run
```

### With UI
```bash
npm run test:ui
```

### With Coverage
```bash
npm run test:coverage
```

---

## Test Structure

```
src/
├── test/
│   ├── setup.ts           # Global test setup
│   └── README.md          # This file
├── utils/
│   └── __tests__/
│       └── accessibility.test.ts   # Example unit tests
└── components/
    └── __tests__/
        └── Button.test.tsx        # Example component tests (TODO)
```

---

## Writing Tests

### Unit Tests (Pure Functions)

**Location:** `src/utils/__tests__/`

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myFunction';

describe('myFunction', () => {
  it('should return expected value', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Component Tests

**Location:** `src/components/__tests__/`

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    await userEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

### Accessibility Tests

**Example:**
```typescript
import { axe } from 'jest-axe';
import { render } from '@testing-library/preact';
import { Button } from '../Button';

describe('Button Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

## Mocking

### Chrome APIs

Chrome APIs are auto-mocked in `setup.ts`:
```typescript
chrome.storage.local.get(/* ... */);
chrome.tabs.query(/* ... */);
// etc.
```

### Custom Mocks

```typescript
import { vi } from 'vitest';

// Mock a function
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');

// Mock a module
vi.mock('../aiService', () => ({
  AIService: vi.fn().mockImplementation(() => ({
    generateContent: vi.fn().mockResolvedValue('AI response'),
  })),
}));
```

---

## Best Practices

### 1. Test Behavior, Not Implementation
```typescript
// Good: Test what the user sees/does
it('should show error message when API key is invalid', () => {
  render(<AISetup apiKey="invalid" />);
  expect(screen.getByRole('alert')).toHaveTextContent('Invalid API key');
});

// Bad: Test internal implementation details
it('should set errorState to true', () => {
  const component = new AISetup({ apiKey: 'invalid' });
  expect(component.state.errorState).toBe(true);
});
```

### 2. Use Testing Library Queries
```typescript
// Prefer (in order):
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email')
screen.getByPlaceholderText('Enter email')
screen.getByText('Submit')

// Avoid:
screen.getByTestId('submit-button')  // Only when nothing else works
```

### 3. Test Accessibility
```typescript
// Always check for accessible names
expect(screen.getByRole('button')).toHaveAccessibleName('Submit form');

// Test keyboard navigation
await userEvent.tab();
expect(screen.getByRole('button')).toHaveFocus();

// Run axe on all components
const results = await axe(container);
expect(results).toHaveNoViolations();
```

### 4. Clean Up
```typescript
// afterEach cleanup is automatic (setup.ts)
// But for timers or listeners:
afterEach(() => {
  vi.clearAllTimers();
  vi.restoreAllMocks();
});
```

---

## Coverage Goals

- **Unit Tests:** 80%+ coverage for utility functions
- **Component Tests:** 70%+ coverage for UI components
- **Integration Tests:** Key user flows covered
- **Accessibility:** All interactive components tested with axe

Current Coverage: Run `npm run test:coverage` to see

---

## Common Patterns

### Testing Async Functions
```typescript
it('should load data', async () => {
  const promise = loadData();
  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await promise;
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});
```

### Testing User Events
```typescript
import { userEvent } from '@testing-library/user-event';

it('should handle form submission', async () => {
  const user = userEvent.setup();
  render(<Form />);

  await user.type(screen.getByLabelText('Name'), 'John Doe');
  await user.click(screen.getByRole('button', { name: 'Submit' }));

  expect(screen.getByText('Form submitted')).toBeInTheDocument();
});
```

### Testing Error States
```typescript
it('should show error when API fails', async () => {
  vi.mocked(apiCall).mockRejectedValue(new Error('API Error'));

  render(<Component />);
  await user.click(screen.getByRole('button'));

  expect(screen.getByRole('alert')).toHaveTextContent('API Error');
});
```

---

## Debugging Tests

### Watch Mode
```bash
# Re-run tests on file changes
npm test
```

### UI Mode
```bash
# Visual test runner
npm run test:ui
```

### Console Logging
```typescript
import { screen } from '@testing-library/preact';

// Print rendered HTML
screen.debug();

// Print specific element
screen.debug(screen.getByRole('button'));
```

### Breakpoints
```typescript
import { vi } from 'vitest';

it('should do something', () => {
  debugger;  // Pause here in Node debugger
  // ... test code
});
```

---

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Push to main branch
- Before releases

See `.github/workflows/test.yml` for configuration.

---

## Resources

- **Vitest:** https://vitest.dev/
- **Testing Library:** https://testing-library.com/docs/preact-testing-library/intro
- **jest-axe:** https://github.com/nickcolley/jest-axe
- **Testing Best Practices:** https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

---

## Contributing

When adding new features:
1. Write tests first (TDD) or alongside implementation
2. Run `npm run test:coverage` to check coverage
3. Ensure all tests pass before opening PR
4. Add accessibility tests for UI components

---

## Current Test Status

✅ **Infrastructure:** Vitest + Testing Library setup complete
✅ **Unit Tests:** Accessibility utilities (15 tests passing)
⏳ **Component Tests:** TODO - Add component tests
⏳ **Integration Tests:** TODO - Add E2E tests
⏳ **A11y Tests:** TODO - Add axe tests for components

**Total Tests:** 15 passing
**Coverage:** Run `npm run test:coverage`

---

_Last Updated: 2025-12-31_
