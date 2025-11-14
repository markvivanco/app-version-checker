/**
 * App store utilities
 * Functions for generating app store URLs and handling store-specific logic
 */

import { Platform, AppStoreConfig } from './types';

/**
 * Generate iOS App Store URL
 * @param appStoreId The iOS App Store ID
 * @param customUrl Optional custom URL to override default
 */
export function getIosStoreUrl(appStoreId?: string, customUrl?: string): string | null {
  if (customUrl) {
    return customUrl;
  }

  if (!appStoreId) {
    return null;
  }

  return `https://apps.apple.com/app/id${appStoreId}`;
}

/**
 * Generate Android Play Store URL
 * @param packageName The Android package name
 * @param customUrl Optional custom URL to override default
 */
export function getAndroidStoreUrl(packageName?: string, customUrl?: string): string | null {
  if (customUrl) {
    return customUrl;
  }

  if (!packageName) {
    return null;
  }

  return `https://play.google.com/store/apps/details?id=${packageName}`;
}

/**
 * Get the appropriate store URL for a platform
 */
export function getStoreUrl(platform: Platform, config: AppStoreConfig): string | null {
  switch (platform) {
    case 'ios':
      return getIosStoreUrl(config.iosAppStoreId, config.iosStoreUrl);
    case 'android':
      return getAndroidStoreUrl(config.androidPackageName, config.androidStoreUrl);
    case 'web':
      return null;
    default:
      return null;
  }
}

/**
 * Validate an iOS App Store ID
 */
export function isValidIosAppStoreId(appStoreId: string): boolean {
  // iOS App Store IDs are typically 9-10 digit numbers
  return /^\d{9,10}$/.test(appStoreId);
}

/**
 * Validate an Android package name
 */
export function isValidAndroidPackageName(packageName: string): boolean {
  // Android package names follow reverse domain name notation
  // e.g., com.example.app
  return /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(packageName);
}

/**
 * Extract app ID from store URL
 */
export function extractAppIdFromUrl(url: string, platform: Platform): string | null {
  if (platform === 'ios') {
    // Extract from URLs like: https://apps.apple.com/app/id123456789
    const match = url.match(/\/id(\d+)/);
    return match ? match[1] : null;
  }

  if (platform === 'android') {
    // Extract from URLs like: https://play.google.com/store/apps/details?id=com.example.app
    const match = url.match(/[?&]id=([^&]+)/);
    return match ? match[1] : null;
  }

  return null;
}

/**
 * Get store name for display
 */
export function getStoreName(platform: Platform): string {
  switch (platform) {
    case 'ios':
      return 'App Store';
    case 'android':
      return 'Google Play Store';
    case 'web':
      return 'Web';
    default:
      return 'Unknown';
  }
}

/**
 * Get store badge image URL (for documentation/UI purposes)
 */
export function getStoreBadgeUrl(platform: Platform, _locale: string = 'en-US'): string | null {
  switch (platform) {
    case 'ios':
      return `https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg`;
    case 'android':
      return `https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png`;
    default:
      return null;
  }
}