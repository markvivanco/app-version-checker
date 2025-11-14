# app-version-checker Implementation Guide

This comprehensive guide will walk you through integrating the `app-version-checker` package into your application, whether it's React, React Native, or any JavaScript framework.

## Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [Installation & Setup](#installation--setup)
3. [Database Requirements](#database-requirements)
4. [Implementing Provider Interfaces](#implementing-provider-interfaces)
5. [React/React Native Integration](#reactreact-native-integration)
6. [Configuration Options](#configuration-options)
7. [Complete Implementation Examples](#complete-implementation-examples)
8. [Testing Your Implementation](#testing-your-implementation)
9. [Migration Guide](#migration-guide)
10. [Troubleshooting & Best Practices](#troubleshooting--best-practices)

---

## Overview & Architecture

### Package Philosophy

The `app-version-checker` package follows a **plugin architecture** with these core principles:

1. **Framework Agnostic Core**: The core logic has zero dependencies
2. **Pluggable Providers**: You implement two interfaces to connect to any backend
3. **Optional React Adapters**: React hooks and components are optional
4. **Platform Aware**: Built-in support for iOS, Android, and Web
5. **Smart Throttling**: Prevents excessive version checks

### Architecture Diagram

```
Your App
    ↓
VersionCheckProvider (React Component)
    ↓
VersionChecker (Core Class)
    ├── IVersionDataProvider (Your Implementation)
    │   └── Fetches version from your backend
    └── IStorageProvider (Your Implementation)
        └── Stores timestamps and preferences
```

### Key Concepts

- **Data Provider**: Fetches version information from your backend
- **Storage Provider**: Persists user preferences (remind later, last check)
- **Version Checker**: Orchestrates the checking logic
- **React Provider**: Optional React context for easy integration

---

## Installation & Setup

### Step 1: Install the Package

#### Option A: Local Package (Recommended for Development)

Copy the package to your project:

```bash
# Copy the entire package folder
cp -r path/to/app-version-checker ./packages/app-version-checker

# Install in your project
npm install ./packages/app-version-checker
# or
yarn add file:./packages/app-version-checker
# or
pnpm add file:./packages/app-version-checker
```

Add to package.json:
```json
{
  "dependencies": {
    "app-version-checker": "file:./packages/app-version-checker"
  }
}
```

#### Option B: NPM Registry (If Published)

```bash
npm install app-version-checker
# or
yarn add app-version-checker
# or
pnpm add app-version-checker
```

### Step 2: Peer Dependencies

For React/React Native apps, ensure you have:

```json
{
  "dependencies": {
    "react": ">=16.8.0"  // For hooks support
  }
}
```

For React Native apps, also ensure:

```json
{
  "dependencies": {
    "react-native": ">=0.60.0",
    "@react-native-async-storage/async-storage": "^1.17.0"  // If using AsyncStorageProvider
  }
```

### Step 3: TypeScript Configuration

If using TypeScript, the package includes full type definitions. No additional setup required.

---

## Database Requirements

You need to store version information somewhere accessible to your app. Here are the required fields:

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `latest_ios_version` | string/text | Latest iOS version (e.g., "1.0.49") |
| `latest_android_version` | string/text | Latest Android version (e.g., "1.0.49") |
| `ios_app_store_id` | string/text | Apple App Store ID (e.g., "123456789") |
| `android_package_name` | string/text | Android package name (e.g., "com.example.app") |

### Optional Fields (For Storage Provider)

| Field | Type | Description |
|-------|------|-------------|
| `version_check_last_check_timestamp` | bigint/number | Unix timestamp of last check |
| `version_check_remind_later_timestamp` | bigint/number | Unix timestamp for remind later |
| `version_check_dismiss_count` | integer | Number of times dismissed |
| `version_check_last_shown_version` | string/text | Last version shown to user |

### SQL Examples

#### PostgreSQL (Supabase)

```sql
-- Create a settings table
CREATE TABLE app_settings (
    id SERIAL PRIMARY KEY,
    -- Version fields
    latest_ios_version TEXT,
    latest_android_version TEXT,
    ios_app_store_id TEXT,
    android_package_name TEXT DEFAULT 'com.example.app',

    -- Storage fields (optional - can also use local storage)
    version_check_last_check_timestamp BIGINT,
    version_check_remind_later_timestamp BIGINT,
    version_check_dismiss_count INTEGER DEFAULT 0,
    version_check_last_shown_version TEXT,

    -- Control fields
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial configuration
INSERT INTO app_settings (
    latest_ios_version,
    latest_android_version,
    ios_app_store_id,
    android_package_name,
    is_active
) VALUES (
    '1.0.0',
    '1.0.0',
    '123456789',
    'com.example.app',
    true
);
```

#### MySQL

```sql
CREATE TABLE app_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    latest_ios_version VARCHAR(20),
    latest_android_version VARCHAR(20),
    ios_app_store_id VARCHAR(20),
    android_package_name VARCHAR(255) DEFAULT 'com.example.app',

    version_check_last_check_timestamp BIGINT,
    version_check_remind_later_timestamp BIGINT,
    version_check_dismiss_count INT DEFAULT 0,
    version_check_last_shown_version VARCHAR(20),

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### MongoDB Schema

```javascript
{
  _id: ObjectId,
  latest_ios_version: String,
  latest_android_version: String,
  ios_app_store_id: String,
  android_package_name: String,

  // Storage fields
  version_check: {
    last_check_timestamp: Number,
    remind_later_timestamp: Number,
    dismiss_count: Number,
    last_shown_version: String
  },

  is_active: Boolean,
  created_at: Date,
  updated_at: Date
}
```

#### Firebase Realtime Database Structure

```json
{
  "app_settings": {
    "versions": {
      "latest_ios_version": "1.0.0",
      "latest_android_version": "1.0.0",
      "ios_app_store_id": "123456789",
      "android_package_name": "com.example.app"
    },
    "user_preferences": {
      "userId": {
        "last_check_timestamp": 1234567890,
        "remind_later_timestamp": 1234567890,
        "dismiss_count": 0,
        "last_shown_version": "1.0.0"
      }
    }
  }
}
```

---

## Implementing Provider Interfaces

### IVersionDataProvider Interface

This interface fetches version information from your backend.

#### Required Methods

```typescript
interface IVersionDataProvider {
  /**
   * Get the current app version
   * @returns Current version string (e.g., "1.0.0")
   */
  getCurrentVersion(): Promise<string> | string;

  /**
   * Get the latest version for a platform
   * @param platform - 'ios', 'android', or 'web'
   * @returns Latest version or null if not available
   */
  getLatestVersion(platform: Platform): Promise<string | null>;

  /**
   * Get app store configuration
   * @returns URLs and IDs for app stores
   */
  getAppStoreConfig(): Promise<AppStoreConfig> | AppStoreConfig;
}
```

#### Optional Methods

```typescript
interface IVersionDataProvider {
  // Optional: Initialize the provider
  initialize?(): Promise<void>;

  // Optional: Get the current platform
  getCurrentPlatform?(): Platform;

  // Optional: Get formatted version string
  getFormattedVersion?(): Promise<string> | string;

  // Optional: Check if update is mandatory
  isUpdateMandatory?(
    currentVersion: string,
    latestVersion: string
  ): Promise<boolean>;

  // Optional: Get changelog for a version
  getChangeLog?(version: string): Promise<string | null>;

  // Optional: Get minimum supported version
  getMinimumSupportedVersion?(platform: Platform): Promise<string | null>;

  // Optional: Clean up resources
  dispose?(): Promise<void>;
}
```

#### Complete Implementation Example: Supabase

```typescript
import { IVersionDataProvider, Platform, AppStoreConfig } from 'app-version-checker/providers';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform as RNPlatform } from 'react-native';

export class SupabaseVersionProvider implements IVersionDataProvider {
  private supabase;
  private cachedSettings: any = null;
  private cacheTimestamp: number = 0;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Required: Get current app version
  getCurrentVersion(): string {
    // For Expo/React Native
    return Constants.expoConfig?.version || '1.0.0';

    // For Web (from package.json)
    // return process.env.REACT_APP_VERSION || '1.0.0';

    // For Electron
    // return app.getVersion();
  }

  // Required: Get latest version from backend
  async getLatestVersion(platform: Platform): Promise<string | null> {
    const settings = await this.fetchSettings();

    switch (platform) {
      case 'ios':
        return settings?.latest_ios_version || null;
      case 'android':
        return settings?.latest_android_version || null;
      case 'web':
        return settings?.latest_web_version || null;
      default:
        return null;
    }
  }

  // Required: Get app store configuration
  async getAppStoreConfig(): Promise<AppStoreConfig> {
    const settings = await this.fetchSettings();

    return {
      iosAppStoreId: settings?.ios_app_store_id,
      androidPackageName: settings?.android_package_name || 'com.example.app',
      // Optional: Custom store URLs
      iosStoreUrl: settings?.ios_app_store_id
        ? `https://apps.apple.com/app/id${settings.ios_app_store_id}`
        : undefined,
      androidStoreUrl: settings?.android_package_name
        ? `https://play.google.com/store/apps/details?id=${settings.android_package_name}`
        : undefined,
    };
  }

  // Optional: Initialize provider
  async initialize(): Promise<void> {
    // Pre-fetch settings on init
    await this.fetchSettings();
  }

  // Optional: Get current platform
  getCurrentPlatform(): Platform {
    // React Native
    if (RNPlatform.OS === 'ios') return 'ios';
    if (RNPlatform.OS === 'android') return 'android';

    // Web detection
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator?.userAgent || '';
      if (/android/i.test(userAgent)) return 'android';
      if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';
      return 'web';
    }

    return 'web';
  }

  // Optional: Get formatted version
  async getFormattedVersion(): Promise<string> {
    const version = this.getCurrentVersion();
    const buildNumber = Constants.expoConfig?.ios?.buildNumber || '0';
    return `${version} (${buildNumber})`;
  }

  // Optional: Check if update is mandatory
  async isUpdateMandatory(
    currentVersion: string,
    latestVersion: string
  ): Promise<boolean> {
    // Force update for major version changes
    const currentMajor = parseInt(currentVersion.split('.')[0]);
    const latestMajor = parseInt(latestVersion.split('.')[0]);
    return latestMajor > currentMajor;
  }

  // Optional: Get changelog
  async getChangeLog(version: string): Promise<string | null> {
    const { data } = await this.supabase
      .from('version_changelog')
      .select('changelog')
      .eq('version', version)
      .single();

    return data?.changelog || null;
  }

  // Optional: Get minimum supported version
  async getMinimumSupportedVersion(platform: Platform): Promise<string | null> {
    const settings = await this.fetchSettings();
    return settings?.[`minimum_${platform}_version`] || null;
  }

  // Helper: Fetch settings with caching
  private async fetchSettings(): Promise<any> {
    // Return cached if fresh
    if (this.cachedSettings && Date.now() - this.cacheTimestamp < this.cacheTimeout) {
      return this.cachedSettings;
    }

    // Fetch from Supabase
    const { data, error } = await this.supabase
      .from('app_settings')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching app settings:', error);
      return this.cachedSettings; // Return stale cache on error
    }

    this.cachedSettings = data;
    this.cacheTimestamp = Date.now();
    return data;
  }

  // Optional: Clean up
  async dispose(): Promise<void> {
    this.cachedSettings = null;
  }
}
```

### IStorageProvider Interface

This interface handles storing user preferences and timestamps.

#### Required Methods

```typescript
interface IStorageProvider {
  /**
   * Get the last time we checked for updates
   * @returns Unix timestamp or null
   */
  getLastCheckTime(): Promise<number | null>;

  /**
   * Set the last check time
   * @param timestamp Unix timestamp
   */
  setLastCheckTime(timestamp: number): Promise<void>;

  /**
   * Get the "remind me later" timestamp
   * @returns Unix timestamp or null
   */
  getRemindLaterTime(): Promise<number | null>;

  /**
   * Set the "remind me later" timestamp
   * @param timestamp Unix timestamp
   */
  setRemindLaterTime(timestamp: number): Promise<void>;

  /**
   * Clear the "remind me later" timestamp
   */
  clearRemindLaterTime(): Promise<void>;
}
```

#### Optional Methods

```typescript
interface IStorageProvider {
  // Optional: Initialize storage
  initialize?(): Promise<void>;

  // Optional: Track dismiss count
  getDismissCount?(): Promise<number>;
  incrementDismissCount?(): Promise<void>;

  // Optional: Track last shown version
  getLastShownVersion?(): Promise<string | null>;
  setLastShownVersion?(version: string): Promise<void>;

  // Optional: Clear all stored data
  clearAll?(): Promise<void>;

  // Optional: Clean up resources
  dispose?(): Promise<void>;
}
```

#### Complete Implementation Example: AsyncStorage (React Native)

```typescript
import { IStorageProvider } from 'app-version-checker/providers';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AsyncStorageProvider implements IStorageProvider {
  private readonly KEYS = {
    LAST_CHECK: '@version_check:last_check',
    REMIND_LATER: '@version_check:remind_later',
    DISMISS_COUNT: '@version_check:dismiss_count',
    LAST_SHOWN: '@version_check:last_shown',
  };

  // Required: Get last check time
  async getLastCheckTime(): Promise<number | null> {
    const value = await AsyncStorage.getItem(this.KEYS.LAST_CHECK);
    return value ? parseInt(value, 10) : null;
  }

  // Required: Set last check time
  async setLastCheckTime(timestamp: number): Promise<void> {
    await AsyncStorage.setItem(this.KEYS.LAST_CHECK, timestamp.toString());
  }

  // Required: Get remind later time
  async getRemindLaterTime(): Promise<number | null> {
    const value = await AsyncStorage.getItem(this.KEYS.REMIND_LATER);
    return value ? parseInt(value, 10) : null;
  }

  // Required: Set remind later time
  async setRemindLaterTime(timestamp: number): Promise<void> {
    await AsyncStorage.setItem(this.KEYS.REMIND_LATER, timestamp.toString());
  }

  // Required: Clear remind later time
  async clearRemindLaterTime(): Promise<void> {
    await AsyncStorage.removeItem(this.KEYS.REMIND_LATER);
  }

  // Optional: Get dismiss count
  async getDismissCount(): Promise<number> {
    const value = await AsyncStorage.getItem(this.KEYS.DISMISS_COUNT);
    return value ? parseInt(value, 10) : 0;
  }

  // Optional: Increment dismiss count
  async incrementDismissCount(): Promise<void> {
    const current = await this.getDismissCount();
    await AsyncStorage.setItem(this.KEYS.DISMISS_COUNT, (current + 1).toString());
  }

  // Optional: Get last shown version
  async getLastShownVersion(): Promise<string | null> {
    return await AsyncStorage.getItem(this.KEYS.LAST_SHOWN);
  }

  // Optional: Set last shown version
  async setLastShownVersion(version: string): Promise<void> {
    await AsyncStorage.setItem(this.KEYS.LAST_SHOWN, version);
  }

  // Optional: Clear all data
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(this.KEYS));
  }
}
```

#### Complete Implementation Example: LocalStorage (Web)

```typescript
import { IStorageProvider } from 'app-version-checker/providers';

export class LocalStorageProvider implements IStorageProvider {
  private readonly PREFIX = 'version_check:';

  // Required: Get last check time
  async getLastCheckTime(): Promise<number | null> {
    const value = localStorage.getItem(`${this.PREFIX}last_check`);
    return value ? parseInt(value, 10) : null;
  }

  // Required: Set last check time
  async setLastCheckTime(timestamp: number): Promise<void> {
    localStorage.setItem(`${this.PREFIX}last_check`, timestamp.toString());
  }

  // Required: Get remind later time
  async getRemindLaterTime(): Promise<number | null> {
    const value = localStorage.getItem(`${this.PREFIX}remind_later`);
    return value ? parseInt(value, 10) : null;
  }

  // Required: Set remind later time
  async setRemindLaterTime(timestamp: number): Promise<void> {
    localStorage.setItem(`${this.PREFIX}remind_later`, timestamp.toString());
  }

  // Required: Clear remind later time
  async clearRemindLaterTime(): Promise<void> {
    localStorage.removeItem(`${this.PREFIX}remind_later`);
  }

  // Optional methods implementation...
  async getDismissCount(): Promise<number> {
    const value = localStorage.getItem(`${this.PREFIX}dismiss_count`);
    return value ? parseInt(value, 10) : 0;
  }

  async incrementDismissCount(): Promise<void> {
    const current = await this.getDismissCount();
    localStorage.setItem(`${this.PREFIX}dismiss_count`, (current + 1).toString());
  }

  async getLastShownVersion(): Promise<string | null> {
    return localStorage.getItem(`${this.PREFIX}last_shown`);
  }

  async setLastShownVersion(version: string): Promise<void> {
    localStorage.setItem(`${this.PREFIX}last_shown`, version);
  }

  async clearAll(): Promise<void> {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.PREFIX));
    keys.forEach(key => localStorage.removeItem(key));
  }
}
```

---

## React/React Native Integration

### Step 1: Create Your Provider Wrapper

```typescript
// src/providers/VersionCheckProvider.tsx
import React, { ReactNode, useCallback } from 'react';
import { Linking, AppState } from 'react-native'; // For React Native
import {
  VersionCheckProvider as BaseVersionCheckProvider,
  useAppStateVersionCheck,
} from 'app-version-checker/react';
import { YourDataProvider } from './YourDataProvider';
import { YourStorageProvider } from './YourStorageProvider';
import { UpdateDialog } from '../components/UpdateDialog';

// Create singleton instances
const dataProvider = new YourDataProvider();
const storageProvider = new YourStorageProvider();

interface VersionCheckProviderProps {
  children: ReactNode;
}

// Inner component for React Native app state monitoring
const VersionCheckContent: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Automatically check on foreground (React Native only)
  useAppStateVersionCheck(AppState, true);
  return <>{children}</>;
};

export const VersionCheckProvider: React.FC<VersionCheckProviderProps> = ({
  children
}) => {
  // Handle opening app store (React Native)
  const handleOpenStore = useCallback(async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening app store:', error);
    }
  }, []);

  // For web, use window.open
  // const handleOpenStore = useCallback(async (url: string) => {
  //   window.open(url, '_blank');
  // }, []);

  return (
    <BaseVersionCheckProvider
      dataProvider={dataProvider}
      storageProvider={storageProvider}
      options={{
        minCheckInterval: 60 * 60 * 1000,        // 1 hour
        remindLaterDuration: 24 * 60 * 60 * 1000, // 24 hours
        skipWebPlatform: true,                    // Don't check on web
      }}
      checkOnMount={true}                        // Check when app starts
      checkOnForeground={true}                   // Check on foreground (React Native)
      onOpenStore={handleOpenStore}
      dialogComponent={UpdateDialog}
    >
      <VersionCheckContent>{children}</VersionCheckContent>
    </BaseVersionCheckProvider>
  );
};

// Re-export the hook
export { useVersionCheck } from 'app-version-checker/react';
```

### Step 2: Create Update Dialog Component

```typescript
// src/components/UpdateDialog.tsx
import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';

interface UpdateDialogProps {
  visible: boolean;
  versionInfo: {
    currentVersion: string;
    latestVersion: string | null;
    updateAvailable: boolean;
    storeUrl: string | null;
    platform: 'ios' | 'android' | 'web';
  };
  onUpdateNow: () => Promise<void>;
  onRemindLater: () => Promise<void>;
  isUpdateMandatory?: boolean;
  changeLog?: string | null;
}

export const UpdateDialog: React.FC<UpdateDialogProps> = ({
  visible,
  versionInfo,
  onUpdateNow,
  onRemindLater,
  isUpdateMandatory = false,
  changeLog,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => !isUpdateMandatory && onRemindLater()}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Update Available!</Text>

          <Text style={styles.message}>
            A new version of the app is available.
          </Text>

          <View style={styles.versionContainer}>
            <View style={styles.versionBox}>
              <Text style={styles.versionLabel}>Current</Text>
              <Text style={styles.versionText}>v{versionInfo.currentVersion}</Text>
            </View>

            <Text style={styles.arrow}>→</Text>

            <View style={styles.versionBox}>
              <Text style={styles.versionLabel}>Latest</Text>
              <Text style={styles.versionText}>v{versionInfo.latestVersion}</Text>
            </View>
          </View>

          {changeLog && (
            <View style={styles.changelogContainer}>
              <Text style={styles.changelogTitle}>What's New:</Text>
              <Text style={styles.changelogText}>{changeLog}</Text>
            </View>
          )}

          <View style={styles.buttons}>
            {!isUpdateMandatory && (
              <TouchableOpacity
                style={[styles.button, styles.laterButton]}
                onPress={onRemindLater}
              >
                <Text style={styles.laterButtonText}>Remind Me Later</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={onUpdateNow}
            >
              <Text style={styles.updateButtonText}>Update Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  versionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  versionBox: {
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 18,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 24,
    marginHorizontal: 16,
    color: '#666',
  },
  changelogContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  changelogTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  changelogText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  laterButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  laterButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### Step 3: Integrate in App Root

```typescript
// App.tsx or _layout.tsx
import React from 'react';
import { VersionCheckProvider } from './providers/VersionCheckProvider';
import { YourAppContent } from './YourAppContent';

export default function App() {
  return (
    <VersionCheckProvider>
      <YourAppContent />
    </VersionCheckProvider>
  );
}
```

### Step 4: Use the Hook

```typescript
// Any component in your app
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useVersionCheck } from '../providers/VersionCheckProvider';

export const SettingsScreen: React.FC = () => {
  const {
    currentVersion,
    latestVersion,
    isUpdateAvailable,
    isChecking,
    checkForUpdates,
    error,
  } = useVersionCheck();

  return (
    <View>
      <Text>Current Version: {currentVersion}</Text>
      <Text>Latest Version: {latestVersion || 'Unknown'}</Text>

      {isUpdateAvailable && (
        <Text style={{ color: 'red' }}>Update Available!</Text>
      )}

      <Button
        title={isChecking ? 'Checking...' : 'Check for Updates'}
        onPress={checkForUpdates}
        disabled={isChecking}
      />

      {error && (
        <Text style={{ color: 'red' }}>Error: {error.message}</Text>
      )}
    </View>
  );
};
```

---

## Configuration Options

### VersionCheckOptions

```typescript
interface VersionCheckOptions {
  /**
   * Minimum interval between version checks (milliseconds)
   * Default: 3600000 (1 hour)
   */
  minCheckInterval?: number;

  /**
   * Duration for "remind me later" (milliseconds)
   * Default: 86400000 (24 hours)
   */
  remindLaterDuration?: number;

  /**
   * Skip version checking on web platform
   * Default: true
   */
  skipWebPlatform?: boolean;

  /**
   * Custom platform detection function
   * Default: Auto-detection
   */
  getPlatform?: () => Platform;
}
```

### Examples

#### Aggressive Checking (Every 5 Minutes)

```typescript
options={{
  minCheckInterval: 5 * 60 * 1000,        // 5 minutes
  remindLaterDuration: 60 * 60 * 1000,    // 1 hour
}}
```

#### Conservative Checking (Once per Day)

```typescript
options={{
  minCheckInterval: 24 * 60 * 60 * 1000,  // 24 hours
  remindLaterDuration: 7 * 24 * 60 * 60 * 1000, // 1 week
}}
```

#### Enable Web Platform Checking

```typescript
options={{
  skipWebPlatform: false,
  minCheckInterval: 60 * 60 * 1000,
}}
```

#### Custom Platform Detection

```typescript
options={{
  getPlatform: () => {
    // Your custom logic
    if (isElectron()) return 'desktop';
    if (isCapacitor()) return 'mobile';
    return 'web';
  }
}}
```

---

## Complete Implementation Examples

### Example 1: Firebase Implementation

```typescript
// FirebaseVersionProvider.ts
import { IVersionDataProvider, Platform, AppStoreConfig } from 'app-version-checker/providers';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export class FirebaseVersionProvider implements IVersionDataProvider {
  private db;
  private firestore;

  constructor(firebaseConfig: any) {
    const app = initializeApp(firebaseConfig);
    this.db = getDatabase(app);
    this.firestore = getFirestore(app);
  }

  getCurrentVersion(): string {
    // Get from your app's config
    return '1.0.0';
  }

  async getLatestVersion(platform: Platform): Promise<string | null> {
    // Using Realtime Database
    const snapshot = await get(ref(this.db, `versions/latest_${platform}_version`));
    return snapshot.val();

    // OR using Firestore
    // const docRef = doc(this.firestore, 'app_settings', 'versions');
    // const docSnap = await getDoc(docRef);
    // return docSnap.data()?.[`latest_${platform}_version`];
  }

  async getAppStoreConfig(): Promise<AppStoreConfig> {
    const snapshot = await get(ref(this.db, 'app_store_config'));
    const data = snapshot.val();

    return {
      iosAppStoreId: data?.ios_app_store_id,
      androidPackageName: data?.android_package_name,
    };
  }

  async isUpdateMandatory(
    currentVersion: string,
    latestVersion: string
  ): Promise<boolean> {
    // Check if current version is below minimum
    const minVersion = await this.getMinimumSupportedVersion('ios');
    if (minVersion) {
      return this.compareVersions(currentVersion, minVersion) < 0;
    }
    return false;
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    return 0;
  }
}
```

### Example 2: REST API Implementation

```typescript
// RestApiVersionProvider.ts
import { IVersionDataProvider, Platform, AppStoreConfig } from 'app-version-checker/providers';

export class RestApiVersionProvider implements IVersionDataProvider {
  private apiUrl: string;
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  getCurrentVersion(): string {
    // Get from build config
    return process.env.REACT_APP_VERSION || '1.0.0';
  }

  async getLatestVersion(platform: Platform): Promise<string | null> {
    const cacheKey = `version_${platform}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiUrl}/versions/${platform}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const version = data.version;

      // Cache the result
      this.cache.set(cacheKey, { data: version, timestamp: Date.now() });

      return version;
    } catch (error) {
      console.error('Error fetching version:', error);
      return null;
    }
  }

  async getAppStoreConfig(): Promise<AppStoreConfig> {
    try {
      const response = await fetch(`${this.apiUrl}/app-store-config`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json();

      return {
        iosAppStoreId: data.ios_app_store_id,
        androidPackageName: data.android_package_name,
      };
    } catch (error) {
      console.error('Error fetching app store config:', error);
      return {};
    }
  }

  async getChangeLog(version: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.apiUrl}/changelog/${version}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json();
      return data.changelog;
    } catch (error) {
      console.error('Error fetching changelog:', error);
      return null;
    }
  }
}
```

### Example 3: GraphQL Implementation

```typescript
// GraphQLVersionProvider.ts
import { IVersionDataProvider, Platform, AppStoreConfig } from 'app-version-checker/providers';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

export class GraphQLVersionProvider implements IVersionDataProvider {
  private client: ApolloClient<any>;

  constructor(graphqlUri: string) {
    this.client = new ApolloClient({
      uri: graphqlUri,
      cache: new InMemoryCache(),
    });
  }

  getCurrentVersion(): string {
    return '1.0.0'; // From your app config
  }

  async getLatestVersion(platform: Platform): Promise<string | null> {
    const query = gql`
      query GetLatestVersion($platform: String!) {
        appVersion(platform: $platform) {
          version
          releaseDate
          isMandatory
        }
      }
    `;

    try {
      const { data } = await this.client.query({
        query,
        variables: { platform },
      });

      return data.appVersion?.version || null;
    } catch (error) {
      console.error('GraphQL error:', error);
      return null;
    }
  }

  async getAppStoreConfig(): Promise<AppStoreConfig> {
    const query = gql`
      query GetAppStoreConfig {
        appStoreConfig {
          iosAppStoreId
          androidPackageName
        }
      }
    `;

    try {
      const { data } = await this.client.query({ query });
      return data.appStoreConfig || {};
    } catch (error) {
      console.error('GraphQL error:', error);
      return {};
    }
  }
}
```

---

## Testing Your Implementation

### Unit Testing Providers

```typescript
// __tests__/VersionProvider.test.ts
import { YourVersionProvider } from '../YourVersionProvider';

describe('YourVersionProvider', () => {
  let provider: YourVersionProvider;

  beforeEach(() => {
    provider = new YourVersionProvider();
  });

  test('getCurrentVersion returns correct version', () => {
    const version = provider.getCurrentVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('getLatestVersion returns version for iOS', async () => {
    const version = await provider.getLatestVersion('ios');
    expect(version).toBeTruthy();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('getAppStoreConfig returns valid config', async () => {
    const config = await provider.getAppStoreConfig();
    expect(config.iosAppStoreId).toBeTruthy();
    expect(config.androidPackageName).toBeTruthy();
  });

  test('isUpdateMandatory works correctly', async () => {
    const result = await provider.isUpdateMandatory('1.0.0', '2.0.0');
    expect(result).toBe(true);
  });
});
```

### Integration Testing

```typescript
// __tests__/VersionCheckIntegration.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { VersionCheckProvider } from '../providers/VersionCheckProvider';
import { TestComponent } from './TestComponent';

// Mock providers
jest.mock('../YourDataProvider', () => ({
  YourDataProvider: jest.fn().mockImplementation(() => ({
    getCurrentVersion: () => '1.0.0',
    getLatestVersion: jest.fn().mockResolvedValue('1.0.1'),
    getAppStoreConfig: jest.fn().mockResolvedValue({
      iosAppStoreId: '123456789',
    }),
  })),
}));

describe('Version Check Integration', () => {
  test('shows update dialog when update available', async () => {
    const { getByText } = render(
      <VersionCheckProvider>
        <TestComponent />
      </VersionCheckProvider>
    );

    await waitFor(() => {
      expect(getByText('Update Available!')).toBeTruthy();
    });
  });
});
```

### Manual Testing Checklist

1. **Fresh Install Testing**
   - [ ] Install app fresh
   - [ ] Verify version check occurs on launch
   - [ ] Verify dialog appears if update available

2. **Foreground/Background Testing (Mobile)**
   - [ ] Put app in background
   - [ ] Wait > minCheckInterval
   - [ ] Bring app to foreground
   - [ ] Verify version check occurs

3. **Remind Me Later Testing**
   - [ ] Click "Remind Me Later"
   - [ ] Close and reopen app
   - [ ] Verify dialog doesn't appear
   - [ ] Wait for remindLaterDuration
   - [ ] Verify dialog appears again

4. **Update Flow Testing**
   - [ ] Click "Update Now"
   - [ ] Verify app store opens
   - [ ] Verify correct app page loads

5. **Network Error Testing**
   - [ ] Disable network
   - [ ] Launch app
   - [ ] Verify graceful error handling
   - [ ] Re-enable network
   - [ ] Verify recovery

6. **Platform Testing**
   - [ ] Test on iOS device/simulator
   - [ ] Test on Android device/emulator
   - [ ] Test on web (if applicable)

---

## Migration Guide

### Migrating from Custom Version Check Code

If you have existing version checking code, follow these steps:

#### Step 1: Identify Your Current Implementation

```typescript
// OLD: Custom implementation
class OldVersionChecker {
  async checkVersion() {
    const currentVersion = getAppVersion();
    const latestVersion = await fetchLatestVersion();
    if (isNewer(latestVersion, currentVersion)) {
      showUpdateDialog();
    }
  }
}
```

#### Step 2: Create Provider Adapters

```typescript
// NEW: Implement IVersionDataProvider
import { IVersionDataProvider } from 'app-version-checker/providers';

export class MigratedVersionProvider implements IVersionDataProvider {
  getCurrentVersion(): string {
    return getAppVersion(); // Your existing function
  }

  async getLatestVersion(platform: Platform): Promise<string | null> {
    return await fetchLatestVersion(); // Your existing function
  }

  async getAppStoreConfig(): Promise<AppStoreConfig> {
    // Adapt your existing config
    return {
      iosAppStoreId: YOUR_IOS_ID,
      androidPackageName: YOUR_ANDROID_PACKAGE,
    };
  }
}
```

#### Step 3: Replace Dialog Code

```typescript
// OLD: Custom dialog
showUpdateDialog();

// NEW: Use the package's dialog system
<VersionCheckProvider dialogComponent={YourUpdateDialog}>
```

#### Step 4: Update Usage Points

```typescript
// OLD: Manual checking
await versionChecker.checkVersion();

// NEW: Use the hook
const { checkForUpdates } = useVersionCheck();
await checkForUpdates();
```

### Migrating from react-native-version-check

```typescript
// OLD: react-native-version-check
import VersionCheck from 'react-native-version-check';

const currentVersion = VersionCheck.getCurrentVersion();
const latestVersion = await VersionCheck.getLatestVersion();

// NEW: app-version-checker
import { useVersionCheck } from './providers/VersionCheckProvider';

const { currentVersion, latestVersion } = useVersionCheck();
```

---

## Troubleshooting & Best Practices

### Common Issues and Solutions

#### Issue: Dialog not showing

**Solution 1**: Check timing configuration
```typescript
// Ensure intervals are not too long
options={{
  minCheckInterval: 1000,           // 1 second for testing
  remindLaterDuration: 5000,        // 5 seconds for testing
}}
```

**Solution 2**: Verify provider implementation
```typescript
// Add logging to your provider
async getLatestVersion(platform: Platform): Promise<string | null> {
  console.log('Getting latest version for:', platform);
  const version = await fetchVersion();
  console.log('Got version:', version);
  return version;
}
```

#### Issue: Dialog shows too frequently

**Solution**: Increase intervals
```typescript
options={{
  minCheckInterval: 24 * 60 * 60 * 1000,    // 24 hours
  remindLaterDuration: 7 * 24 * 60 * 60 * 1000, // 1 week
}}
```

#### Issue: App store not opening

**Solution**: Verify store configuration
```typescript
async getAppStoreConfig(): Promise<AppStoreConfig> {
  return {
    // Ensure these are correct
    iosAppStoreId: '123456789',        // Your actual App Store ID
    androidPackageName: 'com.yourcompany.yourapp', // Your actual package
  };
}
```

#### Issue: Version comparison not working

**Solution**: Ensure semantic versioning
```typescript
// Good: Semantic versioning
'1.0.0', '1.0.1', '2.0.0'

// Bad: Non-semantic versions
'1.0', 'v1.0.0', '1.0.0-beta'
```

### Best Practices

#### 1. Cache Backend Responses

```typescript
class CachedVersionProvider implements IVersionDataProvider {
  private cache = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getLatestVersion(platform: Platform): Promise<string | null> {
    const cacheKey = `version_${platform}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const version = await this.fetchFromBackend(platform);
    this.cache.set(cacheKey, { data: version, timestamp: Date.now() });
    return version;
  }
}
```

#### 2. Handle Network Errors Gracefully

```typescript
async getLatestVersion(platform: Platform): Promise<string | null> {
  try {
    return await this.fetchVersion(platform);
  } catch (error) {
    console.warn('Failed to fetch version:', error);
    // Return cached version or null
    return this.getCachedVersion(platform);
  }
}
```

#### 3. Use Environment-Specific Configuration

```typescript
const config = {
  minCheckInterval: __DEV__
    ? 60 * 1000           // 1 minute in development
    : 60 * 60 * 1000,     // 1 hour in production

  remindLaterDuration: __DEV__
    ? 5 * 60 * 1000       // 5 minutes in development
    : 24 * 60 * 60 * 1000, // 24 hours in production
};
```

#### 4. Implement Gradual Rollout

```typescript
async isUpdateAvailable(currentVersion: string, latestVersion: string): Promise<boolean> {
  // Check if user is in rollout percentage
  const userId = await getUserId();
  const rolloutPercentage = await this.getRolloutPercentage(latestVersion);

  if (!this.isUserInRollout(userId, rolloutPercentage)) {
    return false;
  }

  return this.compareVersions(currentVersion, latestVersion) < 0;
}
```

#### 5. Track Analytics

```typescript
const handleUpdateNow = async () => {
  // Track user action
  analytics.track('update_prompt_accepted', {
    current_version: currentVersion,
    latest_version: latestVersion,
    platform: Platform.OS,
  });

  await openAppStore();
};

const handleRemindLater = async () => {
  analytics.track('update_prompt_dismissed', {
    current_version: currentVersion,
    latest_version: latestVersion,
  });

  await setRemindMeLater();
};
```

#### 6. Security Considerations

```typescript
// Always validate version format
function isValidVersion(version: string): boolean {
  const semverRegex = /^\d+\.\d+\.\d+$/;
  return semverRegex.test(version);
}

async getLatestVersion(platform: Platform): Promise<string | null> {
  const version = await this.fetchVersion(platform);

  // Validate before returning
  if (!isValidVersion(version)) {
    console.error('Invalid version format:', version);
    return null;
  }

  return version;
}
```

---

## Advanced Features

### Implementing A/B Testing

```typescript
class ABTestingVersionProvider implements IVersionDataProvider {
  async shouldShowUpdatePrompt(userId: string): Promise<boolean> {
    // Get user's test group
    const testGroup = await this.getTestGroup(userId);

    // Different behavior per group
    switch (testGroup) {
      case 'aggressive':
        return true; // Always show
      case 'conservative':
        return Math.random() > 0.5; // 50% chance
      default:
        return true; // Default behavior
    }
  }
}
```

### Implementing Staged Rollouts

```typescript
class StagedRolloutProvider implements IVersionDataProvider {
  async getLatestVersion(platform: Platform): Promise<string | null> {
    const userId = await this.getUserId();
    const rolloutStage = await this.getRolloutStage();

    // Different versions per stage
    if (rolloutStage === 'beta' && this.isBetaUser(userId)) {
      return '2.0.0-beta';
    } else if (rolloutStage === 'production') {
      return '1.9.0';
    }

    return '1.8.0'; // Stable version
  }
}
```

### Custom Platform Support

```typescript
// Support for Electron apps
class ElectronVersionProvider implements IVersionDataProvider {
  getCurrentVersion(): string {
    const { app } = require('electron');
    return app.getVersion();
  }

  getCurrentPlatform(): Platform {
    const os = require('os');
    const platform = os.platform();

    if (platform === 'darwin') return 'mac';
    if (platform === 'win32') return 'windows';
    return 'linux';
  }
}
```

---

## Conclusion

You now have everything you need to implement the app-version-checker package in your application:

1. ✅ Database schema for storing version information
2. ✅ Complete provider implementations for various backends
3. ✅ React/React Native integration code
4. ✅ Custom dialog components
5. ✅ Testing strategies
6. ✅ Migration guides
7. ✅ Best practices and troubleshooting

Remember to:
- Start with the minimal implementation and add features as needed
- Test thoroughly on all target platforms
- Monitor version check analytics
- Keep your backend version data updated

For additional help:
- Check the package README for API documentation
- Review the example implementations in this guide
- Test with the provided test utilities

Happy implementing! 🚀