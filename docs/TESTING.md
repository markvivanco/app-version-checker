# Testing Guide for app-version-checker

This guide provides detailed instructions for testing the version checker package in Tag The Bin.

## 🚀 Quick Test Setup

### 1. Build the Package First

```bash
# Navigate to the package directory
cd packages/app-version-checker

# Install dependencies
pnpm install

# Build the package
pnpm build

# Go back to the root
cd ../..

# Install to link the local package
pnpm install
```

### 2. Switch to the New Version Provider

```bash
# Backup the original provider
cp src/providers/VersionCheckProvider.tsx src/providers/VersionCheckProvider.backup.tsx

# Replace with the new one
cp src/providers/VersionCheckProvider.new.tsx src/providers/VersionCheckProvider.tsx
```

### 3. Update Imports in Tag The Bin

Edit `src/lib/adapters/SupabaseVersionProvider.ts`:
```typescript
// Change the import path from:
import { IVersionDataProvider, Platform as CheckerPlatform, AppStoreConfig } from '../../../packages/app-version-checker/src';

// To:
import { IVersionDataProvider, Platform as CheckerPlatform, AppStoreConfig } from 'app-version-checker';
```

Edit `src/lib/adapters/SupabaseStorageProvider.ts`:
```typescript
// Change the import path from:
import { IStorageProvider } from '../../../packages/app-version-checker/src';

// To:
import { IStorageProvider } from 'app-version-checker';
```

Edit `src/providers/VersionCheckProvider.tsx` (the new one):
```typescript
// Change imports from:
import { VersionCheckProvider as BaseVersionCheckProvider, useAppStateVersionCheck } from '../../packages/app-version-checker/src/adapters/react';

// To:
import { VersionCheckProvider as BaseVersionCheckProvider, useAppStateVersionCheck } from 'app-version-checker/react';

// Also at the bottom, change:
export { useVersionCheck } from '../../packages/app-version-checker/src/adapters/react';

// To:
export { useVersionCheck } from 'app-version-checker/react';
```

## 📱 Testing Scenarios

### Test 1: Basic Version Check (No Update Available)

**Setup:**
1. Check your current app version in `app.json`:
   ```json
   "version": "1.0.439"
   ```

2. Set the same version in your database:
   ```sql
   -- Run this in your Supabase SQL editor
   UPDATE app_settings
   SET
     latest_ios_version = '1.0.49',
     latest_android_version = '1.0.49'
   WHERE id = 1;
   ```

3. Clear any existing version check data:
   ```sql
   UPDATE app_settings
   SET
     version_check_remind_later_timestamp = NULL,
     version_check_last_check_timestamp = NULL
   WHERE id = 1;
   ```

**Test:**
```bash
# Start the app
pnpm start

# Choose your platform (iOS/Android)
```

**Expected Result:**
- No update dialog should appear
- App should start normally

**Verify:**
```javascript
// In src/components/common/AppSidebarDrawer.tsx, add a console.log
const { formattedVersion, isUpdateAvailable } = useVersionCheck();
console.log('Version Check:', { formattedVersion, isUpdateAvailable });
// Should show: { formattedVersion: "1.0.49.439", isUpdateAvailable: false }
```

---

### Test 2: Update Available

**Setup:**
1. Set a higher version in the database:
   ```sql
   UPDATE app_settings
   SET
     latest_ios_version = '1.1.0',
     latest_android_version = '1.1.0',
     version_check_remind_later_timestamp = NULL,
     version_check_last_check_timestamp = NULL
   WHERE id = 1;
   ```

**Test:**
```bash
# Restart the app
pnpm start
```

**Expected Result:**
- Update dialog should appear immediately
- Shows "Update Available!" with current version → new version
- Two buttons: "Remind Me Later" and "Update Now"

---

### Test 3: Remind Me Later Functionality

**Setup:**
1. Ensure update dialog is showing (from Test 2)

**Test:**
1. Click "Remind Me Later"
2. Note the time
3. Restart the app immediately

**Expected Result:**
- Dialog should NOT appear (24-hour delay is active)

**Verify in Database:**
```sql
-- Check the remind later timestamp was set
SELECT
  version_check_remind_later_timestamp,
  -- Convert to readable date
  to_timestamp(version_check_remind_later_timestamp/1000) as remind_time
FROM app_settings
WHERE id = 1;
```

**Test Override:**
```sql
-- Set remind time to past to test again
UPDATE app_settings
SET version_check_remind_later_timestamp = 1
WHERE id = 1;

-- Now restart app - dialog should appear again
```

---

### Test 4: Minimum Check Interval

**Setup:**
1. Clear timestamps and set update available:
   ```sql
   UPDATE app_settings
   SET
     latest_ios_version = '1.1.0',
     version_check_remind_later_timestamp = NULL,
     version_check_last_check_timestamp = NULL
   WHERE id = 1;
   ```

**Test:**
1. Start app - dialog appears
2. Click "Remind Me Later"
3. Clear ONLY the remind later timestamp:
   ```sql
   UPDATE app_settings
   SET version_check_remind_later_timestamp = NULL
   WHERE id = 1;
   ```
4. Restart app within 1 hour

**Expected Result:**
- Dialog should NOT appear (minimum 1-hour interval between checks)

---

### Test 5: Update Now - App Store Links

**Setup:**
1. Set the iOS App Store ID in database:
   ```sql
   UPDATE app_settings
   SET
     ios_app_store_id = '6450456986',  -- Tag The Bin's actual ID
     latest_ios_version = '1.1.0'
   WHERE id = 1;
   ```

**Test on iOS:**
1. Start app on iOS
2. Click "Update Now"

**Expected Result:**
- Should open App Store to your app's page
- URL should be: `https://apps.apple.com/app/id6450456986`

**Test on Android:**
1. Start app on Android
2. Click "Update Now"

**Expected Result:**
- Should open Play Store to your app's page
- URL should be: `https://play.google.com/store/apps/details?id=com.markit.tagthebin`

---

### Test 6: Web Platform (Should Skip)

**Test:**
```bash
pnpm run web
```

**Expected Result:**
- No update dialog should ever appear on web
- Version check should be completely bypassed

**Verify:**
```javascript
// Add logging in VersionCheckProvider.new.tsx
console.log('Platform:', dataProvider.getCurrentPlatform());
// Should show: Platform: web
```

---

### Test 7: App Foreground/Background

**Setup:**
1. Set update available in database
2. Clear timestamps

**Test on Mobile:**
1. Start app - dialog appears
2. Dismiss with "Remind Me Later"
3. Clear remind timestamp in database
4. Put app in background (go to home screen)
5. Wait a few seconds
6. Return to app

**Expected Result:**
- Dialog should appear again when returning to foreground

---

## 🧪 Unit Testing the Package

### Create Test File

Create `packages/app-version-checker/src/core/__tests__/version-compare.test.ts`:

```typescript
import {
  compareVersions,
  isUpdateAvailable,
  parseVersion,
  formatVersion
} from '../version-compare';

describe('Version Comparison', () => {
  test('compareVersions should handle basic comparisons', () => {
    expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
    expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
  });

  test('should handle different version lengths', () => {
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.0', '1.0.0.1')).toBe(-1);
  });

  test('isUpdateAvailable should return correct boolean', () => {
    expect(isUpdateAvailable('1.0.0', '1.0.1')).toBe(true);
    expect(isUpdateAvailable('1.0.1', '1.0.0')).toBe(false);
    expect(isUpdateAvailable('1.0.0', '1.0.0')).toBe(false);
  });

  test('parseVersion should extract components', () => {
    const parsed = parseVersion('1.2.3.456');
    expect(parsed.major).toBe(1);
    expect(parsed.minor).toBe(2);
    expect(parsed.patch).toBe(3);
    expect(parsed.build).toBe(456);
  });
});
```

Run tests:
```bash
cd packages/app-version-checker
pnpm test
```

---

## 🔍 Debug Mode Testing

### Add Debug Logging

Create a debug version for testing:

Edit `src/providers/VersionCheckProvider.tsx`:
```typescript
// Add at the top of the component
useEffect(() => {
  if (__DEV__) {
    console.log('🔄 Version Check Debug:', {
      platform: dataProvider.getCurrentPlatform(),
      currentVersion: dataProvider.getCurrentVersion(),
    });
  }
}, []);
```

### Monitor Storage Values

Add a debug component to see storage values:

```typescript
// src/components/debug/VersionDebug.tsx
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useVersionCheck } from 'app-version-checker/react';
import { appSettingsService } from '@/lib/appSettingsService';

export const VersionDebug = () => {
  const { versionInfo, isUpdateAvailable } = useVersionCheck();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const load = async () => {
      const s = await appSettingsService.getSettings();
      setSettings({
        latestIOS: s.latest_ios_version,
        latestAndroid: s.latest_android_version,
        remindLater: s.version_check_remind_later_timestamp
          ? new Date(s.version_check_remind_later_timestamp).toLocaleString()
          : 'Not set',
        lastCheck: s.version_check_last_check_timestamp
          ? new Date(s.version_check_last_check_timestamp).toLocaleString()
          : 'Never',
      });
    };
    load();
  }, []);

  if (!__DEV__) return null;

  return (
    <View style={{ padding: 10, backgroundColor: '#f0f0f0' }}>
      <Text>🔍 Version Debug</Text>
      <Text>Current: {versionInfo?.currentVersion}</Text>
      <Text>Latest: {versionInfo?.latestVersion}</Text>
      <Text>Update Available: {isUpdateAvailable ? '✅' : '❌'}</Text>
      {settings && (
        <>
          <Text>DB Latest iOS: {settings.latestIOS}</Text>
          <Text>DB Latest Android: {settings.latestAndroid}</Text>
          <Text>Remind Later: {settings.remindLater}</Text>
          <Text>Last Check: {settings.lastCheck}</Text>
        </>
      )}
    </View>
  );
};
```

---

## 🎮 Manual Testing Checklist

### Platform Testing
- [ ] iOS Simulator - Update dialog appears
- [ ] iOS Device - App Store link works
- [ ] Android Emulator - Update dialog appears
- [ ] Android Device - Play Store link works
- [ ] Web Browser - No dialog appears

### Feature Testing
- [ ] Dialog shows correct versions
- [ ] "Update Now" opens correct store
- [ ] "Remind Me Later" delays for 24 hours
- [ ] Minimum 1-hour interval between checks works
- [ ] App foreground/background triggers check
- [ ] Version number displays in sidebar

### Edge Cases
- [ ] No network connection - app doesn't crash
- [ ] Invalid version in database - handles gracefully
- [ ] Missing App Store ID - shows warning
- [ ] Rapid app switching - no duplicate dialogs

---

## 🛠️ Troubleshooting

### Dialog Not Appearing?

1. Check database values:
```sql
SELECT * FROM app_settings WHERE id = 1;
```

2. Check console for errors:
```javascript
// Look for errors like:
// "Error getting latest version:"
// "Error checking for updates:"
```

3. Verify version comparison:
```javascript
// In browser console or React Native Debugger
const current = "1.0.49";
const latest = "1.1.0";
console.log(current < latest); // Should be true
```

### Wrong Store URL?

Check the configuration:
```sql
SELECT
  ios_app_store_id,
  latest_ios_version,
  latest_android_version
FROM app_settings;
```

### Storage Not Persisting?

Test storage directly:
```javascript
// In your app, add a test button:
const testStorage = async () => {
  const storage = new SupabaseStorageProvider();
  await storage.setLastCheckTime(Date.now());
  const time = await storage.getLastCheckTime();
  console.log('Storage test:', time);
};
```

---

## 📊 Performance Testing

Monitor the performance:

```typescript
// Add timing logs
const start = Date.now();
const result = await versionChecker.shouldShowUpdatePrompt();
console.log(`Version check took: ${Date.now() - start}ms`);
```

Expected times:
- First check: < 500ms
- Cached check: < 50ms
- With network delay: < 2000ms

---

## ✅ Sign-off Checklist

Before considering the package ready:

- [ ] All test scenarios pass
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Works on all platforms
- [ ] Old code can be safely removed
- [ ] Documentation is complete

Once all tests pass, you can:
1. Remove old files (`versionManager.ts`, old `VersionCheckProvider.tsx`)
2. Publish the package to npm
3. Use in other projects!