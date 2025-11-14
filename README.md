# app-version-checker

Universal app version checking and update prompts for React, React Native, and web applications.

## Features

- 🔄 **Semantic Version Comparison** - Full support for major.minor.patch.build versioning
- 📱 **Multi-Platform Support** - Works with iOS, Android, and Web
- 🏗️ **Framework Agnostic** - Core logic has zero dependencies
- ⚛️ **React Integration** - Optional React hooks and context providers
- 🔌 **Pluggable Architecture** - Bring your own data source and storage
- 🎯 **Smart Timing** - Configurable check intervals and "remind me later" functionality
- 🏪 **App Store Integration** - Generate App Store and Play Store URLs
- 📦 **Tree-Shakeable** - Import only what you need
- 📝 **TypeScript** - Full type definitions included

## Installation

```bash
npm install app-version-checker
# or
yarn add app-version-checker
# or
pnpm add app-version-checker
```

## Quick Start

### Basic Usage (Vanilla JavaScript)

```typescript
import { VersionChecker } from 'app-version-checker';
import { LocalStorageProvider } from 'app-version-checker/stores';

// Create your data provider
class MyDataProvider {
  getCurrentVersion() {
    return '1.0.0';
  }

  async getLatestVersion(platform) {
    // Fetch from your API
    const response = await fetch(`/api/version/${platform}`);
    const data = await response.json();
    return data.version;
  }

  getAppStoreConfig() {
    return {
      iosAppStoreId: '123456789',
      androidPackageName: 'com.example.app'
    };
  }
}

// Initialize the checker
const checker = new VersionChecker(
  new MyDataProvider(),
  new LocalStorageProvider(),
  {
    minCheckInterval: 60 * 60 * 1000, // 1 hour
    remindLaterDuration: 24 * 60 * 60 * 1000, // 24 hours
  }
);

// Check for updates
const result = await checker.shouldShowUpdatePrompt();
if (result.shouldShowPrompt) {
  // Show your update dialog
  console.log(`Update available: ${result.versionInfo.latestVersion}`);
}
```

### React Usage

```tsx
import React from 'react';
import { VersionCheckProvider, useVersionCheck } from 'app-version-checker/react';
import { LocalStorageProvider } from 'app-version-checker/stores';

// Your update dialog component
const UpdateDialog = ({ visible, versionInfo, onUpdateNow, onRemindLater }) => {
  if (!visible) return null;

  return (
    <div className="update-dialog">
      <h2>Update Available!</h2>
      <p>Version {versionInfo.latestVersion} is now available</p>
      <button onClick={onUpdateNow}>Update Now</button>
      <button onClick={onRemindLater}>Remind Me Later</button>
    </div>
  );
};

// App component
function App() {
  return (
    <VersionCheckProvider
      dataProvider={new MyDataProvider()}
      storageProvider={new LocalStorageProvider()}
      dialogComponent={UpdateDialog}
    >
      <YourApp />
    </VersionCheckProvider>
  );
}

// Using the hook in a component
function YourComponent() {
  const { isUpdateAvailable, currentVersion, checkForUpdates } = useVersionCheck();

  return (
    <div>
      <p>Current version: {currentVersion}</p>
      {isUpdateAvailable && <p>An update is available!</p>}
      <button onClick={checkForUpdates}>Check for Updates</button>
    </div>
  );
}
```

### React Native Usage

```tsx
import React from 'react';
import { VersionCheckProvider, useAppStateVersionCheck } from 'app-version-checker/react';
import { AsyncStorageProvider } from 'app-version-checker/stores';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Linking } from 'react-native';

// Create providers
const storageProvider = new AsyncStorageProvider(AsyncStorage);

function App() {
  const handleOpenStore = async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <VersionCheckProvider
      dataProvider={new MyDataProvider()}
      storageProvider={storageProvider}
      onOpenStore={handleOpenStore}
      checkOnForeground={true}
    >
      <AppContent />
    </VersionCheckProvider>
  );
}

// Use app state checking
function AppContent() {
  // Automatically check when app comes to foreground
  useAppStateVersionCheck(AppState, true);

  return <YourApp />;
}
```

## Provider Interfaces

### Data Provider

Implement `IVersionDataProvider` to fetch version data from your source:

```typescript
interface IVersionDataProvider {
  getCurrentVersion(): Promise<string> | string;
  getLatestVersion(platform: Platform): Promise<string | null>;
  getAppStoreConfig(): Promise<AppStoreConfig> | AppStoreConfig;

  // Optional methods
  getCurrentPlatform?(): Platform;
  getFormattedVersion?(): Promise<string> | string;
  isUpdateMandatory?(currentVersion: string, latestVersion: string): Promise<boolean> | boolean;
  getChangeLog?(version: string): Promise<string | null>;
}
```

### Storage Provider

Implement `IStorageProvider` to store preferences:

```typescript
interface IStorageProvider {
  getLastCheckTime(): Promise<number | null>;
  setLastCheckTime(timestamp: number): Promise<void>;
  getRemindLaterTime(): Promise<number | null>;
  setRemindLaterTime(timestamp: number): Promise<void>;
  clearRemindLaterTime(): Promise<void>;

  // Optional methods
  getDismissCount?(): Promise<number>;
  incrementDismissCount?(): Promise<void>;
}
```

## Built-in Providers

### Storage Providers

- **LocalStorageProvider** - For web browsers
- **AsyncStorageProvider** - For React Native
- **InMemoryStorageProvider** - For testing

### Example Data Providers

See the `examples/` folder for sample implementations:

- REST API provider
- GraphQL provider
- Firebase provider
- Supabase provider

## Core Utilities

### Version Comparison

```typescript
import { compareVersions, isUpdateAvailable } from 'app-version-checker/core';

// Compare versions
compareVersions('1.0.0', '1.0.1'); // Returns -1
compareVersions('2.0.0', '1.9.9'); // Returns 1
compareVersions('1.0.0', '1.0.0'); // Returns 0

// Check if update needed
isUpdateAvailable('1.0.0', '1.0.1'); // Returns true
```

### Version Formatting

```typescript
import { formatVersionWithBuild, parseVersion } from 'app-version-checker/core';

// Format with build number
formatVersionWithBuild('1.0.0', '123'); // Returns '1.0.0.123'

// Parse version
parseVersion('1.2.3.456');
// Returns { major: 1, minor: 2, patch: 3, build: 456 }
```

### Store URLs

```typescript
import { getStoreUrl } from 'app-version-checker/core';

const url = getStoreUrl('ios', {
  iosAppStoreId: '123456789'
});
// Returns: https://apps.apple.com/app/id123456789
```

## React Hooks

### useVersionCheck

Main hook for accessing version check context:

```typescript
const {
  versionInfo,           // Current version information
  isUpdateAvailable,     // Boolean flag
  currentVersion,        // Current app version
  formattedVersion,      // Formatted version string
  showUpdateDialog,      // Dialog visibility state
  isChecking,           // Loading state
  error,                // Any errors
  checkForUpdates,      // Manual check function
  handleUpdateNow,      // Open app store
  handleRemindLater,    // Set reminder
} = useVersionCheck();
```

### usePeriodicVersionCheck

Check for updates at regular intervals:

```typescript
usePeriodicVersionCheck(
  60 * 60 * 1000, // Check every hour
  true            // Enabled
);
```

### useVisibilityVersionCheck

Check when page becomes visible (web):

```typescript
useVisibilityVersionCheck(true);
```

## Configuration Options

```typescript
const options = {
  // Minimum time between version checks (milliseconds)
  minCheckInterval: 60 * 60 * 1000, // Default: 1 hour

  // Duration for "remind me later" (milliseconds)
  remindLaterDuration: 24 * 60 * 60 * 1000, // Default: 24 hours

  // Skip version checking on web platform
  skipWebPlatform: true, // Default: true

  // Custom platform detection
  getPlatform: () => detectPlatform(), // Optional
};
```

## Migration from Existing Code

If you have existing version checking code, here's how to migrate:

1. **Extract your version fetching logic** into a data provider
2. **Choose or implement a storage provider** for preferences
3. **Replace your version checking logic** with VersionChecker
4. **Update your UI components** to use the provided hooks

See `examples/migration/` for detailed migration guides.

## Examples

Check the `examples/` directory for:

- React web app example
- React Native app example
- Next.js integration
- Vue.js integration
- Firebase integration
- Supabase integration
- Custom provider examples

## Testing

The package includes utilities for testing:

```typescript
import { InMemoryStorageProvider } from 'app-version-checker/stores';

// Use in-memory storage for tests
const testStorage = new InMemoryStorageProvider();

// Mock your data provider
const mockDataProvider = {
  getCurrentVersion: () => '1.0.0',
  getLatestVersion: () => Promise.resolve('2.0.0'),
  // ...
};
```

## API Reference

Full API documentation is available at [docs/api.md](docs/api.md).

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Your Name]

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Support

- 📧 Email: your-email@example.com
- 💬 Discord: [Join our community](https://discord.gg/example)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/app-version-checker/issues)