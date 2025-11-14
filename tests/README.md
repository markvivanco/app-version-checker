# VersionCheckProvider Tests

This folder contains test scripts and components for the VersionCheckProvider component.

## Test Files

- **test-version-component.js** - Standalone Node.js test that tests the component as a React component
- **test-version-checker.sh** - Shell script wrapper for running the Node.js test
- **web-app/** - Standalone web application for browser-based testing (no Expo required)

## Running the Tests

### 1. Browser-Based Interactive Tests (Recommended)

Run the standalone test web server (no Expo required):

```bash
# Start the standalone test server
pnpm run test:version:web

# Then open in your browser:
# http://localhost:8083
```

The browser test page provides:
- Interactive test execution with visual feedback
- Live component demo
- Test results with pass/fail indicators
- Usage examples
- Real-time component testing

### 2. Command-Line Tests

Run the standalone Node.js test:

```bash
# Using npm/pnpm scripts
pnpm run test:version

# Or directly with Node.js
node packages/app-version-checker/tests/test-version-component.js

# Or using the shell script
pnpm run test:version:shell
```

### 3. Quick Test Info

```bash
# Shows instructions for accessing the web test
pnpm run test:version:web
```

## Test Coverage

The tests validate:

✅ **Component Creation** - Tests React.createElement with VersionCheckProvider
✅ **Component Lifecycle** - Constructor, mount, and render methods
✅ **Props Validation** - All props are properly passed and handled
✅ **Multiple Children** - Component accepts multiple child components
✅ **Error Handling** - Async operations handle errors gracefully
✅ **Version Comparison** - Semver comparison logic works correctly

## Test Scenarios

1. **Version Comparisons**
   - Patch updates (1.0.0 → 1.0.1)
   - Minor updates (1.0.0 → 1.1.0)
   - Major updates (1.0.0 → 2.0.0)
   - Same versions (1.2.3 → 1.2.3)
   - Older versions (2.0.0 → 1.9.9)

2. **Component Behavior**
   - Async version fetching
   - Error states
   - Dialog display logic
   - State management

## Usage Examples

The test demonstrates the component being used as a React Component:

### JSX Usage
```jsx
<VersionCheckProvider
  appVersion={() => '1.0.0'}
  storeVersion={async () => '1.0.1'}
  dialogComponent={CustomUpdateDialog}
>
  <App />
</VersionCheckProvider>
```

### JavaScript (without JSX)
```javascript
React.createElement(
  VersionCheckProvider,
  {
    appVersion: () => '1.0.0',
    storeVersion: async () => '1.0.1',
    dialogComponent: CustomUpdateDialog
  },
  React.createElement(App)
)
```

## Notes

- The component is tested as a React Component, not as a function
- Tests use React.createElement for component creation
- The web test page works on all browsers that support React Native Web
- Command-line tests work with Node.js v14+