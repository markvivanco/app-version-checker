# Version Checker Complete Test Flow

This document provides a comprehensive test flow for the enhanced version checker implementation with all optional fields.

## Prerequisites

Before testing, ensure:
1. ✅ Migration script has been applied to Supabase
2. ✅ All code changes have been saved
3. ✅ App is running in development mode

## Test Flow Checklist

### 1. Database Setup Verification

#### A. Verify appsettings Table Fields
```sql
-- Run in Supabase SQL Editor
SELECT
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'appsettings'
AND column_name IN (
    'android_package_name',
    'minimum_ios_version',
    'minimum_android_version',
    'minimum_web_version',
    'ios_update_mandatory',
    'android_update_mandatory',
    'ios_changelog',
    'android_changelog',
    'web_changelog',
    'ios_custom_update_url',
    'android_custom_update_url',
    'web_update_url',
    'version_check_enabled',
    'version_check_interval_hours'
)
ORDER BY column_name;
```

**Expected**: All columns should exist with correct types

#### B. Verify profiles Table Fields
```sql
-- Run in Supabase SQL Editor
SELECT
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name LIKE 'version_%'
ORDER BY column_name;
```

**Expected**: Should see all version_* columns

### 2. Basic Version Check Test

#### A. Set Test Version Data
```sql
-- Set a newer version to trigger update prompt
UPDATE appsettings
SET
    latest_ios_version = '99.0.0',
    latest_android_version = '99.0.0',
    ios_changelog = 'Test update available',
    android_changelog = 'Test update available',
    version_check_enabled = true,
    version_check_interval_hours = 0  -- Check immediately
WHERE id IS NOT NULL;
```

#### B. Test in App
1. **Reload the app**
2. **Expected**: Update dialog should appear
3. **Verify**: Dialog shows version 99.0.0
4. **Click**: "Remind Later"

#### C. Verify User Preferences Saved
```sql
-- Check if user preferences were saved
SELECT
    id,
    version_dismiss_count,
    version_remind_later_timestamp,
    version_last_shown_version
FROM profiles
WHERE id = 'YOUR_USER_ID';
```

**Expected**: dismiss_count = 1, remind_later_timestamp is set

### 3. Mandatory Update Test

#### A. Enable Mandatory Update
```sql
UPDATE appsettings
SET
    ios_update_mandatory = true,
    android_update_mandatory = true
WHERE id IS NOT NULL;
```

#### B. Test in App
1. **Reload the app**
2. **Expected**: Update dialog appears without dismiss option
3. **Verify**: Only "Update Now" button is visible

### 4. Minimum Version Test

#### A. Set Minimum Version
```sql
UPDATE appsettings
SET
    minimum_ios_version = '100.0.0',
    minimum_android_version = '100.0.0',
    ios_update_mandatory = false,
    android_update_mandatory = false
WHERE id IS NOT NULL;
```

#### B. Test in App
1. **Reload the app**
2. **Expected**: Forced update (current version below minimum)
3. **Verify**: Update is mandatory even though flags are false

### 5. Custom Update URL Test

#### A. Set Custom URLs
```sql
UPDATE appsettings
SET
    ios_custom_update_url = 'https://testflight.apple.com/join/test123',
    android_custom_update_url = 'https://play.google.com/apps/testing/com.example'
WHERE id IS NOT NULL;
```

#### B. Test Update Link
1. **Click**: "Update Now" button
2. **Expected**: Should attempt to open custom URL
3. **Verify**: Console logs show custom URL being used

### 6. Changelog Display Test

#### A. Set Detailed Changelog
```sql
UPDATE appsettings
SET
    ios_changelog = '• New feature: Dark mode\n• Bug fixes\n• Performance improvements',
    android_changelog = '• New feature: Dark mode\n• Bug fixes\n• Performance improvements'
WHERE id IS NOT NULL;
```

#### B. Verify in App
1. **Reload the app**
2. **Expected**: Update dialog shows formatted changelog
3. **Verify**: Changelog is properly displayed

### 7. User Preference Tests

#### A. Test Auto-Check Disabled
```sql
-- Disable auto-check for user
UPDATE profiles
SET version_auto_check_enabled = false
WHERE id = 'YOUR_USER_ID';
```

1. **Reload the app**
2. **Expected**: No automatic version check
3. **Verify**: No update dialog appears

#### B. Test Dismiss Count
```sql
-- Set high dismiss count
UPDATE profiles
SET version_dismiss_count = 10
WHERE id = 'YOUR_USER_ID';
```

1. **Check**: Application behavior with high dismiss count
2. **Expected**: May affect check frequency or dialog behavior

### 8. Platform-Specific Tests

#### A. iOS-Specific Settings
```sql
UPDATE appsettings
SET
    latest_ios_version = '2.0.0',
    latest_android_version = '1.0.0',
    ios_update_mandatory = true,
    android_update_mandatory = false
WHERE id IS NOT NULL;
```

**Test on iOS**: Should see mandatory update to 2.0.0
**Test on Android**: Should see optional update to 1.0.0

### 9. Version Check Interval Test

#### A. Set Check Interval
```sql
UPDATE appsettings
SET version_check_interval_hours = 24
WHERE id IS NOT NULL;

-- Clear last check timestamp
UPDATE profiles
SET version_last_check_timestamp = NULL
WHERE id = 'YOUR_USER_ID';
```

#### B. Verify Interval
1. **First load**: Version check occurs
2. **Reload immediately**: No version check (within 24 hours)
3. **Check database**: `version_last_check_timestamp` is set

### 10. Web Platform Test

#### A. Configure Web Version
```sql
UPDATE appsettings
SET
    latest_web_version = '1.5.0',
    web_changelog = 'Web-specific updates',
    web_update_url = 'https://app.example.com',
    minimum_web_version = '1.0.0'
WHERE id IS NOT NULL;
```

#### B. Test on Web
1. **Run app in web browser**
2. **Expected**: Web-specific version checking
3. **Verify**: Uses web_update_url for updates

### 11. Reset Test Data

After testing, reset to normal values:

```sql
-- Reset appsettings to normal
UPDATE appsettings
SET
    latest_ios_version = '1.0.49',
    latest_android_version = '49',
    latest_web_version = NULL,
    ios_update_mandatory = false,
    android_update_mandatory = false,
    minimum_ios_version = NULL,
    minimum_android_version = NULL,
    minimum_web_version = NULL,
    ios_changelog = NULL,
    android_changelog = NULL,
    web_changelog = NULL,
    ios_custom_update_url = NULL,
    android_custom_update_url = NULL,
    web_update_url = NULL,
    version_check_enabled = true,
    version_check_interval_hours = 1
WHERE id IS NOT NULL;

-- Reset user preferences
UPDATE profiles
SET
    version_dismiss_count = 0,
    version_remind_later_timestamp = NULL,
    version_last_check_timestamp = NULL,
    version_last_shown_version = NULL,
    version_auto_check_enabled = true
WHERE id = 'YOUR_USER_ID';
```

## Automated Test Script

Create a test script to run through all scenarios:

```javascript
// test-version-checker.js
async function runVersionCheckerTests() {
    console.log('🧪 Starting Version Checker Tests...\n');

    const tests = [
        { name: 'Basic Version Check', fn: testBasicVersionCheck },
        { name: 'Mandatory Update', fn: testMandatoryUpdate },
        { name: 'Minimum Version', fn: testMinimumVersion },
        { name: 'Custom URLs', fn: testCustomURLs },
        { name: 'Changelog Display', fn: testChangelog },
        { name: 'User Preferences', fn: testUserPreferences },
        { name: 'Platform Specific', fn: testPlatformSpecific },
        { name: 'Check Intervals', fn: testCheckIntervals },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            console.log(`Running: ${test.name}`);
            await test.fn();
            console.log(`✅ ${test.name} PASSED\n`);
            passed++;
        } catch (error) {
            console.error(`❌ ${test.name} FAILED:`, error.message, '\n');
            failed++;
        }
    }

    console.log('📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${(passed / tests.length * 100).toFixed(1)}%`);
}

// Individual test functions
async function testBasicVersionCheck() {
    // Implementation here
}

async function testMandatoryUpdate() {
    // Implementation here
}

// ... more test functions

// Run tests
runVersionCheckerTests();
```

## Test Coverage Matrix

| Feature | Unit Test | Integration Test | E2E Test | Manual Test |
|---------|-----------|-----------------|----------|-------------|
| Basic Version Check | ✅ | ✅ | ✅ | ✅ |
| Mandatory Updates | ✅ | ✅ | ⚠️ | ✅ |
| Minimum Version | ✅ | ✅ | ⚠️ | ✅ |
| Custom URLs | ✅ | ✅ | ❌ | ✅ |
| Changelog Display | ✅ | ✅ | ✅ | ✅ |
| User Preferences | ✅ | ✅ | ⚠️ | ✅ |
| Platform Specific | ✅ | ⚠️ | ❌ | ✅ |
| Check Intervals | ✅ | ✅ | ⚠️ | ✅ |
| Web Platform | ✅ | ⚠️ | ❌ | ✅ |

Legend:
- ✅ Fully tested
- ⚠️ Partially tested
- ❌ Not tested / Not applicable

## Common Issues & Solutions

### Issue 1: Update Dialog Not Appearing
**Cause**: Version check disabled or within interval
**Solution**:
```sql
UPDATE appsettings SET version_check_enabled = true, version_check_interval_hours = 0;
UPDATE profiles SET version_last_check_timestamp = NULL WHERE id = 'USER_ID';
```

### Issue 2: User Preferences Not Saving
**Cause**: User not authenticated
**Solution**: Ensure user is logged in before version check

### Issue 3: Wrong Platform Version
**Cause**: Platform detection issue
**Solution**: Check Platform.OS value in React Native

### Issue 4: Custom URL Not Working
**Cause**: URL format or Linking configuration
**Solution**: Verify URL format and Linking.canOpenURL permissions

## Performance Testing

### Load Test Query
```sql
-- Simulate multiple users checking versions
DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..1000 LOOP
        PERFORM get_user_version_preferences(gen_random_uuid());
    END LOOP;
END $$;
```

### Measure Response Time
```javascript
console.time('Version Check');
await versionChecker.checkForUpdate();
console.timeEnd('Version Check');
// Should be < 500ms
```

## Security Testing

1. **SQL Injection**: Test with malicious version strings
2. **XSS**: Test changelog with script tags
3. **Rate Limiting**: Ensure checks are throttled
4. **Auth Bypass**: Verify RLS policies work

## Regression Testing

After any changes:
1. Run all automated tests
2. Verify backward compatibility
3. Test upgrade path from old version
4. Ensure no data loss

## Sign-off Checklist

- [ ] All database fields verified
- [ ] Basic version check working
- [ ] Mandatory updates tested
- [ ] Minimum version enforcement tested
- [ ] Custom URLs functional
- [ ] Changelogs display correctly
- [ ] User preferences persist
- [ ] Platform-specific logic works
- [ ] Check intervals respected
- [ ] Web platform supported
- [ ] Performance acceptable
- [ ] Security verified
- [ ] No regressions found

---

**Test Date**: ___________
**Tested By**: ___________
**App Version**: ___________
**Result**: PASS / FAIL

## Notes

_Add any additional notes or observations from testing here_