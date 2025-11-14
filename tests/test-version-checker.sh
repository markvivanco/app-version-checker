#!/bin/bash

# Test script for VersionCheckProvider React Component
# This script runs a JavaScript file that tests the component as a React component

echo "╔════════════════════════════════════════════════╗"
echo "║   VersionCheckProvider Component Test Suite   ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to run the tests."
    exit 1
fi

echo "📍 Node.js version: $(node --version)"
echo ""

# Run the JavaScript component test
echo "🧪 Running React Component Tests..."
echo "────────────────────────────────────────────────"
echo ""

# Execute the component test file with Node.js
node packages/app-version-checker/tests/test-version-component.js

# Check if the test ran successfully
if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║           ✅ All Tests Passed!                ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""
    echo "📝 Component Usage Examples:"
    echo ""
    echo "1️⃣  Basic Usage (JSX):"
    echo "   <VersionCheckProvider"
    echo "     storeVersion={fetchVersionFromAPI}"
    echo "     dialogComponent={UpdateDialog}"
    echo "   >"
    echo "     <App />"
    echo "   </VersionCheckProvider>"
    echo ""
    echo "2️⃣  With Custom App Version (JSX):"
    echo "   <VersionCheckProvider"
    echo "     appVersion={() => '1.0.0'}"
    echo "     storeVersion={async () => '1.2.0'}"
    echo "     dialogComponent={UpdateDialog}"
    echo "   >"
    echo "     <App />"
    echo "   </VersionCheckProvider>"
    echo ""
    echo "3️⃣  JavaScript (without JSX):"
    echo "   React.createElement(VersionCheckProvider, {"
    echo "     storeVersion: async () => '1.2.0',"
    echo "     dialogComponent: UpdateDialog"
    echo "   }, React.createElement(App));"
    echo ""
    echo "📂 Test file: test-version-component.js"
    echo "📊 Component tested as React component ✓"
    echo "🔧 Props validation tested ✓"
    echo "👶 Children rendering tested ✓"
    echo "♻️  Lifecycle methods tested ✓"
    echo "⚠️  Error handling tested ✓"
    echo ""
else
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║           ❌ Tests Failed!                    ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""
    echo "Please check the test output above for errors."
    exit 1
fi