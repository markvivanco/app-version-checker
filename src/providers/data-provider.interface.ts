/**
 * Data provider interface for version checking
 * Implement this interface to provide version data from any source
 */

import { Platform, AppStoreConfig } from '../core/types';

/**
 * Interface for providing version data from any source
 * (REST API, GraphQL, Firebase, Supabase, local storage, etc.)
 */
export interface IVersionDataProvider {
  /**
   * Get the current version of the app
   * This could be from package.json, environment variables, or app constants
   */
  getCurrentVersion(): Promise<string> | string;

  /**
   * Get the latest available version for a specific platform
   * This is typically fetched from a backend service or configuration
   */
  getLatestVersion(platform: Platform): Promise<string | null>;

  /**
   * Get app store configuration
   * Returns IDs and URLs needed to generate store links
   */
  getAppStoreConfig(): Promise<AppStoreConfig> | AppStoreConfig;

  /**
   * Optional: Get the current platform
   * If not implemented, the version checker will use its own detection
   */
  getCurrentPlatform?(): Platform;

  /**
   * Optional: Get formatted version string
   * Can include build numbers or other formatting
   */
  getFormattedVersion?(): Promise<string> | string;

  /**
   * Optional: Check if updates should be forced
   * Some critical updates might require mandatory installation
   */
  isUpdateMandatory?(currentVersion: string, latestVersion: string): Promise<boolean> | boolean;

  /**
   * Optional: Get changelog or release notes for the latest version
   */
  getChangeLog?(version: string): Promise<string | null>;

  /**
   * Optional: Get minimum supported version
   * Apps older than this version might not work properly
   */
  getMinimumSupportedVersion?(platform: Platform): Promise<string | null>;

  /**
   * Optional: Custom validation for version availability
   * Can be used to implement staged rollouts or regional restrictions
   */
  isVersionAvailableForUser?(version: string, platform: Platform): Promise<boolean>;

  /**
   * Optional: Initialize the provider
   * Called once when the version checker is initialized
   */
  initialize?(): Promise<void>;

  /**
   * Optional: Clean up resources
   * Called when the version checker is disposed
   */
  dispose?(): Promise<void>;
}

/**
 * Abstract base class for data providers
 * Provides default implementations for optional methods
 */
export abstract class BaseVersionDataProvider implements IVersionDataProvider {
  abstract getCurrentVersion(): Promise<string> | string;
  abstract getLatestVersion(platform: Platform): Promise<string | null>;
  abstract getAppStoreConfig(): Promise<AppStoreConfig> | AppStoreConfig;

  getCurrentPlatform?(): Platform {
    // Default implementation can be overridden
    if (typeof window !== 'undefined' && !('ReactNativeWebView' in window)) {
      return 'web';
    }
    // Platform detection would be handled by the specific implementation
    return 'web';
  }

  async initialize(): Promise<void> {
    // Default no-op implementation
  }

  async dispose(): Promise<void> {
    // Default no-op implementation
  }
}