# Standalone VersionCheckProvider Test App

This is a **completely standalone** web application for testing the VersionCheckProvider component. It runs independently without requiring Expo or the main app.

## Features

✅ **No Dependencies on Main App** - Runs completely standalone
✅ **Lightweight** - Uses vanilla JavaScript and React from CDN
✅ **Interactive Testing** - Visual test interface in the browser
✅ **No Build Process** - Just HTML, CSS, and JavaScript
✅ **Instant Startup** - Simple HTTP server, no webpack bundling

## Quick Start

From the project root:

```bash
pnpm run test:version:web
```

Then open your browser to: **http://localhost:8083**

## Files

- `index.html` - Main HTML entry point
- `styles.css` - All styling for the test app
- `test-app.js` - Test logic and React components
- `server.js` - Simple Node.js HTTP server
- `package.json` - Package configuration

## Running Directly

You can also run from this directory:

```bash
cd packages/app-version-checker/tests/web-app
npm start
# or
node server.js
```

## What You'll See

1. **Test Statistics Bar** - Real-time pass/fail counts
2. **Run All Tests Button** - Execute all tests with one click
3. **Live Component Demo** - See VersionCheckProvider in action
4. **Test Results** - Detailed results for each test case
5. **Usage Examples** - Copy-ready code snippets

## Test Coverage

The app tests:

- ✅ Version comparison logic (semver)
- ✅ Component creation with React.createElement
- ✅ Component lifecycle methods
- ✅ Props validation
- ✅ Multiple children support
- ✅ Error handling in async operations
- ✅ Async version fetching

## Customizing

### Change Port

Set the PORT environment variable:

```bash
PORT=3000 node server.js
```

### Modify Tests

Edit `test-app.js` to add or modify test cases. The tests automatically run when the page loads.

## Technologies Used

- **React 18** - Loaded from CDN
- **Vanilla JavaScript** - No transpilation needed
- **Pure CSS** - No frameworks or preprocessors
- **Node.js HTTP Server** - Simple static file serving

## Why Standalone?

This test app is designed to:

1. Test the component in isolation
2. Avoid Expo/React Native overhead
3. Provide instant feedback
4. Be easily shareable and runnable
5. Work on any system with Node.js

## Browser Support

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Any browser supporting ES6+

## Notes

- The component is tested as a React Component, not a function
- Uses React.createElement for proper component testing
- No JSX compilation needed - pure JavaScript
- Tests run automatically on page load
- Can re-run tests without refreshing the page