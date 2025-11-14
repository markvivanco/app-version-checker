# Enhanced Version Checker Features

## Overview

This document describes the enhanced features implemented for the app-version-checker package based on the optional fields from IMPLEMENTATION.md. These enhancements provide more robust version management, user preferences, and platform-specific configurations.

## Database Schema Enhancements

### 1. App Settings Table - New Fields

The following fields have been added to the `app_settings` table:

#### Platform Configuration
- **`android_package_name`** - Store the Android package name (was previously hardcoded)
- **`ios_custom_update_url`** - Optional custom iOS update URL
- **`android_custom_update_url`** - Optional custom Android update URL
- **`web_update_url`** - Web platform update URL

#### Version Control
- **`minimum_ios_version`** - Minimum supported iOS version
- **`minimum_android_version`** - Minimum supported Android version
- **`minimum_web_version`** - Minimum supported web version
- **`latest_web_version`** - Latest available web version

#### Update Enforcement
- **`ios_update_mandatory`** - Force iOS users to update
- **`android_update_mandatory`** - Force Android users to update

#### Changelogs
- **`ios_changelog`** - iOS version changelog
- **`android_changelog`** - Android version changelog
- **`web_changelog`** - Web version changelog

#### Feature Control
- **`version_check_enabled`** - Global flag to enable/disable version checking
- **`version_check_interval_hours`** - Hours between automatic checks

### 2. User Version Preferences Table (New)

A new `user_version_preferences` table stores per-user settings:

```sql
CREATE TABLE user_version_preferences (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),

    -- Tracking
    last_check_timestamp BIGINT,
    remind_later_timestamp BIGINT,
    dismiss_count INTEGER DEFAULT 0,
    last_shown_version TEXT,
    last_dismissed_version TEXT,

    -- Preferences
    auto_check_enabled BOOLEAN DEFAULT true,
    show_preview_updates BOOLEAN DEFAULT false,

    -- Platform-specific dismissals
    ios_dismissed_version TEXT,
    android_dismissed_version TEXT,
    web_dismissed_version TEXT,

    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

### 3. Version History Table (New)

Optional table for tracking version history:

```sql
CREATE TABLE version_history (
    id UUID PRIMARY KEY,
    platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
    version TEXT NOT NULL,
    changelog TEXT,
    is_mandatory BOOLEAN DEFAULT false,
    minimum_supported_version TEXT,
    release_date TIMESTAMP,
    created_at TIMESTAMP
)
```

## Enhanced Provider Features

### SupabaseVersionProvider Enhancements

#### 1. Dynamic Package Name
```typescript
// Now reads from database instead of hardcoded
androidPackageName: settings.android_package_name || 'com.markit.tagthebin'
```

#### 2. Custom Update URLs
```typescript
// Supports custom URLs for each platform
iosStoreUrl: settings.ios_custom_update_url || generateStandardUrl()
androidStoreUrl: settings.android_custom_update_url || generateStandardUrl()
webUpdateUrl: settings.web_update_url
```

#### 3. Mandatory Update Logic
```typescript
async isUpdateMandatory(currentVersion, latestVersion) {
  // Check platform-specific mandatory flags
  if (platform === 'ios' && settings.ios_update_mandatory) return true;

  // Check if below minimum supported version
  if (currentVersion < minimumVersion) return true;

  // Check for major version changes
  if (majorVersionIncreased) return true;
}
```

#### 4. Changelog Support
```typescript
async getChangeLog(version) {
  // Returns platform-specific changelog
  return settings[`${platform}_changelog`];
}
```

#### 5. Minimum Version Enforcement
```typescript
async getMinimumSupportedVersion(platform) {
  // Returns minimum version for platform
  return settings[`minimum_${platform}_version`];
}
```

### SupabaseStorageProvider Enhancements

#### 1. Per-User Storage
All preferences are now stored per-user instead of globally:

```typescript
// Old: Stored in app_settings (global)
// New: Stored in user_version_preferences (per-user)
```

#### 2. Enhanced Methods
```typescript
// Track dismiss count
async getDismissCount(): Promise<number>
async incrementDismissCount(): Promise<void>

// Track shown versions
async getLastShownVersion(): Promise<string | null>
async setLastShownVersion(version: string): Promise<void>

// Track dismissed versions
async getLastDismissedVersion(): Promise<string | null>
async setLastDismissedVersion(version: string): Promise<void>

// User preferences
async isAutoCheckEnabled(): Promise<boolean>
async setAutoCheckEnabled(enabled: boolean): Promise<void>
```

#### 3. Automatic User Initialization
```typescript
// Automatically creates user preferences on first access
// Handles authenticated and anonymous users gracefully
```

## Usage Examples

### 1. Force Update for Critical Versions

```sql
-- Force all iOS users to update
UPDATE app_settings
SET ios_update_mandatory = true,
    ios_changelog = 'Critical security update - immediate update required';
```

### 2. Set Minimum Supported Versions

```sql
-- Users below these versions will be forced to update
UPDATE app_settings
SET minimum_ios_version = '2.0.0',
    minimum_android_version = '2.0.0';
```

### 3. Custom Update URLs

```sql
-- Use TestFlight for iOS beta testing
UPDATE app_settings
SET ios_custom_update_url = 'https://testflight.apple.com/join/YOUR_CODE';
```

### 4. Check User Preferences

```typescript
// In your app code
const storage = new SupabaseStorageProvider();
const dismissCount = await storage.getDismissCount();

if (dismissCount > 5) {
  // User has dismissed 5+ times, maybe reduce check frequency
}
```

### 5. Respect User Preferences

```typescript
const autoCheckEnabled = await storage.isAutoCheckEnabled();
if (!autoCheckEnabled) {
  // User disabled auto-checking, skip version check
  return;
}
```

## Migration Instructions

### 1. Run the Database Migration

```bash
# Apply the migration to your Supabase database
supabase db push
```

Or run the SQL manually:
```sql
-- Execute the migration script at:
-- supabase/migrations/20241102_add_version_checker_fields.sql
```

### 2. Update Environment Variables

No new environment variables required - uses existing Supabase configuration.

### 3. Initialize Default Values

```sql
-- Set your current app versions
UPDATE app_settings
SET android_package_name = 'com.markit.tagthebin',
    version_check_enabled = true,
    version_check_interval_hours = 1;
```

## Benefits of Enhanced Implementation

### 1. **User-Centric**
- Per-user preferences respect individual choices
- Users can disable auto-checking if desired
- Dismiss count tracking prevents nagging

### 2. **Platform-Specific Control**
- Different update strategies per platform
- Platform-specific changelogs
- Custom update URLs for beta testing

### 3. **Flexible Update Enforcement**
- Mandatory updates for critical fixes
- Minimum version enforcement
- Gradual rollout capabilities

### 4. **Better Analytics**
- Track user update behavior
- Monitor dismiss rates
- Understand version adoption

### 5. **Developer-Friendly**
- Clear separation of concerns
- Easy to extend
- Well-documented database schema

## Security Considerations

### Row Level Security (RLS)

The migration includes RLS policies:

1. **User Preferences**: Users can only access their own preferences
2. **Version History**: Read-only access for all authenticated users
3. **App Settings**: Read-only access for authenticated users

### Data Privacy

- User preferences are isolated per user
- No cross-user data leakage
- Automatic cleanup on user deletion (CASCADE)

## Testing the Enhanced Features

### 1. Test Mandatory Updates

```typescript
// Set a version as mandatory
UPDATE app_settings SET ios_update_mandatory = true;

// User should see forced update dialog
```

### 2. Test User Preferences

```typescript
// User dismisses update
await storage.setRemindLaterTime(Date.now() + 86400000);

// Check dismiss count increased
const count = await storage.getDismissCount(); // Should be 1
```

### 3. Test Minimum Version

```typescript
// Set minimum version above current
UPDATE app_settings SET minimum_ios_version = '99.0.0';

// isUpdateMandatory should return true
```

## Troubleshooting

### Issue: Migration Fails

**Solution**: Check if tables already exist:
```sql
SELECT * FROM information_schema.tables
WHERE table_name = 'user_version_preferences';
```

### Issue: User Preferences Not Saving

**Solution**: Verify user is authenticated:
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user?.id);
```

### Issue: Version Check Not Working

**Solution**: Check if enabled:
```sql
SELECT version_check_enabled, version_check_interval_hours
FROM app_settings;
```

## Future Enhancements

Consider implementing:

1. **A/B Testing**: Roll out updates to percentage of users
2. **Geographic Rollout**: Deploy by region
3. **User Segments**: Target specific user groups
4. **Analytics Integration**: Track update metrics
5. **Automated Rollback**: Revert if issues detected

## Conclusion

These enhancements transform the basic version checker into a comprehensive update management system with user preferences, platform-specific controls, and flexible enforcement options. The implementation maintains backward compatibility while adding powerful new capabilities for managing app updates across all platforms.