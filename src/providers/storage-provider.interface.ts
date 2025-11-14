/**
 * Storage provider interface for version check preferences
 * Implement this interface to store timestamps and preferences in any storage system
 */

/**
 * Interface for storing version check timestamps and preferences
 * Can be implemented using localStorage, AsyncStorage, database, etc.
 */
export interface IStorageProvider {
  /**
   * Get the timestamp of the last version check
   */
  getLastCheckTime(): Promise<number | null>;

  /**
   * Set the timestamp of the last version check
   */
  setLastCheckTime(timestamp: number): Promise<void>;

  /**
   * Get the "remind me later" timestamp
   * Returns when the reminder period expires
   */
  getRemindLaterTime(): Promise<number | null>;

  /**
   * Set the "remind me later" timestamp
   */
  setRemindLaterTime(timestamp: number): Promise<void>;

  /**
   * Clear the "remind me later" timestamp
   */
  clearRemindLaterTime(): Promise<void>;

  /**
   * Optional: Get the number of times update was dismissed
   */
  getDismissCount?(): Promise<number>;

  /**
   * Optional: Increment the dismiss count
   */
  incrementDismissCount?(): Promise<void>;

  /**
   * Optional: Get the last shown version
   * Useful to avoid showing the same update multiple times
   */
  getLastShownVersion?(): Promise<string | null>;

  /**
   * Optional: Set the last shown version
   */
  setLastShownVersion?(version: string): Promise<void>;

  /**
   * Optional: Get user preference for auto-updates
   */
  getAutoUpdateEnabled?(): Promise<boolean>;

  /**
   * Optional: Set user preference for auto-updates
   */
  setAutoUpdateEnabled?(enabled: boolean): Promise<void>;

  /**
   * Optional: Get all stored preferences as an object
   */
  getAllPreferences?(): Promise<Record<string, any>>;

  /**
   * Optional: Clear all stored data
   */
  clearAll?(): Promise<void>;

  /**
   * Optional: Initialize the storage provider
   */
  initialize?(): Promise<void>;

  /**
   * Optional: Dispose of resources
   */
  dispose?(): Promise<void>;
}

/**
 * Abstract base class for storage providers
 * Provides default implementations for optional methods
 */
export abstract class BaseStorageProvider implements IStorageProvider {
  abstract getLastCheckTime(): Promise<number | null>;
  abstract setLastCheckTime(timestamp: number): Promise<void>;
  abstract getRemindLaterTime(): Promise<number | null>;
  abstract setRemindLaterTime(timestamp: number): Promise<void>;
  abstract clearRemindLaterTime(): Promise<void>;

  async getDismissCount(): Promise<number> {
    return 0;
  }

  async incrementDismissCount(): Promise<void> {
    // Default no-op
  }

  async initialize(): Promise<void> {
    // Default no-op
  }

  async dispose(): Promise<void> {
    // Default no-op
  }
}

/**
 * In-memory storage provider for testing
 */
export class InMemoryStorageProvider extends BaseStorageProvider {
  private storage: Map<string, any> = new Map();

  async getLastCheckTime(): Promise<number | null> {
    return this.storage.get('lastCheckTime') || null;
  }

  async setLastCheckTime(timestamp: number): Promise<void> {
    this.storage.set('lastCheckTime', timestamp);
  }

  async getRemindLaterTime(): Promise<number | null> {
    return this.storage.get('remindLaterTime') || null;
  }

  async setRemindLaterTime(timestamp: number): Promise<void> {
    this.storage.set('remindLaterTime', timestamp);
  }

  async clearRemindLaterTime(): Promise<void> {
    this.storage.delete('remindLaterTime');
  }

  async getDismissCount(): Promise<number> {
    return this.storage.get('dismissCount') || 0;
  }

  async incrementDismissCount(): Promise<void> {
    const current = await this.getDismissCount();
    this.storage.set('dismissCount', current + 1);
  }

  async getLastShownVersion(): Promise<string | null> {
    return this.storage.get('lastShownVersion') || null;
  }

  async setLastShownVersion(version: string): Promise<void> {
    this.storage.set('lastShownVersion', version);
  }

  async clearAll(): Promise<void> {
    this.storage.clear();
  }

  async getAllPreferences(): Promise<Record<string, any>> {
    const preferences: Record<string, any> = {};
    this.storage.forEach((value, key) => {
      preferences[key] = value;
    });
    return preferences;
  }
}