# Web Test Instructions for VersionCheckProvider

## Quick Start

To run the interactive web tests for VersionCheckProvider:

```bash
# This command will start the Expo web server
pnpm run test:version:web
```

Wait for the server to start (you'll see "webpack compiled successfully" in the terminal), then:

1. Open your browser
2. Navigate to: **http://localhost:8081/test-version-provider**

## What You'll See

The web test page includes:

- **Interactive Test Suite**: Click "Run All Tests" to execute tests
- **Live Component Demo**: See the VersionCheckProvider in action
- **Visual Results**: Green checkmarks ✅ for passed tests, red X ❌ for failures
- **Test Statistics**: Real-time count of passed/failed tests
- **Usage Examples**: Copy-ready code snippets

## Available Test Commands

```bash
# Start web server and run browser tests
pnpm run test:version:web

# Show web test instructions (doesn't start server)
pnpm run test:version:web:info

# Run command-line tests (no browser needed)
pnpm run test:version

# Run shell script tests
pnpm run test:version:shell
```

## Troubleshooting

If you see "This site can't be reached":
1. Make sure you ran `pnpm run test:version:web` (not just `:info`)
2. Wait for "webpack compiled successfully" message
3. Check the port isn't already in use: `lsof -i :8081`
4. Try refreshing the browser after the server starts

## Alternative Ports

If port 8081 is already in use, Expo will automatically select the next available port.
Check the terminal output for the actual URL.

## Browser Support

The test page works on all modern browsers:
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Test Coverage

The browser tests validate:
- ✅ Component creation with React.createElement
- ✅ Component lifecycle (constructor, mount, render)
- ✅ Props validation and passing
- ✅ Multiple children support
- ✅ Error handling in async operations
- ✅ Version comparison logic (semver)

## Notes

- The component is tested as a React Component, not as a function
- Tests use React.createElement for proper component testing
- The web page provides real-time, visual feedback
- You can re-run tests multiple times without restarting the server