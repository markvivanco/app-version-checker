/**
 * AsyncStorage implementation of IStorageProvider
 * For use with React Native AsyncStorage or similar async storage APIs
 */

import { BaseStorageProvider } from '../../providers/storage-provider.interface';

/**
 * Interface matching React Native AsyncStorage API
 */
export interface IAsyncStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys?(): Promise<string[]>;
  multiRemove?(keys: string[]): Promise<void>;
}

export class AsyncStorageProvider extends BaseStorageProvider {
  private readonly storage: IAsyncStorage;
  private readonly prefix: string;

  constructor(storage: IAsyncStorage, prefix: string = 'app_version_check_') {
    super();
    this.storage = storage;
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async getLastCheckTime(): Promise<number | null> {
    try {
      const value = await this.storage.getItem(this.getKey('lastCheckTime'));
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      console.error('Error reading last check time:', error);
      return null;
    }
  }

  async setLastCheckTime(timestamp: number): Promise<void> {
    try {
      await this.storage.setItem(this.getKey('lastCheckTime'), timestamp.toString());
    } catch (error) {
      console.error('Error setting last check time:', error);
    }
  }

  async getRemindLaterTime(): Promise<number | null> {
    try {
      const value = await this.storage.getItem(this.getKey('remindLaterTime'));
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      console.error('Error reading remind later time:', error);
      return null;
    }
  }

  async setRemindLaterTime(timestamp: number): Promise<void> {
    try {
      await this.storage.setItem(this.getKey('remindLaterTime'), timestamp.toString());
    } catch (error) {
      console.error('Error setting remind later time:', error);
    }
  }

  async clearRemindLaterTime(): Promise<void> {
    try {
      await this.storage.removeItem(this.getKey('remindLaterTime'));
    } catch (error) {
      console.error('Error clearing remind later time:', error);
    }
  }

  async getDismissCount(): Promise<number> {
    try {
      const value = await this.storage.getItem(this.getKey('dismissCount'));
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      console.error('Error reading dismiss count:', error);
      return 0;
    }
  }

  async incrementDismissCount(): Promise<void> {
    try {
      const current = await this.getDismissCount();
      await this.storage.setItem(this.getKey('dismissCount'), (current + 1).toString());
    } catch (error) {
      console.error('Error incrementing dismiss count:', error);
    }
  }

  async getLastShownVersion(): Promise<string | null> {
    try {
      return await this.storage.getItem(this.getKey('lastShownVersion'));
    } catch (error) {
      console.error('Error reading last shown version:', error);
      return null;
    }
  }

  async setLastShownVersion(version: string): Promise<void> {
    try {
      await this.storage.setItem(this.getKey('lastShownVersion'), version);
    } catch (error) {
      console.error('Error setting last shown version:', error);
    }
  }

  async getAutoUpdateEnabled(): Promise<boolean> {
    try {
      const value = await this.storage.getItem(this.getKey('autoUpdateEnabled'));
      return value === 'true';
    } catch (error) {
      console.error('Error reading auto update preference:', error);
      return false;
    }
  }

  async setAutoUpdateEnabled(enabled: boolean): Promise<void> {
    try {
      await this.storage.setItem(this.getKey('autoUpdateEnabled'), enabled.toString());
    } catch (error) {
      console.error('Error setting auto update preference:', error);
    }
  }

  async getAllPreferences(): Promise<Record<string, any>> {
    const preferences: Record<string, any> = {};
    const keys = [
      'lastCheckTime',
      'remindLaterTime',
      'dismissCount',
      'lastShownVersion',
      'autoUpdateEnabled'
    ];

    for (const key of keys) {
      try {
        const value = await this.storage.getItem(this.getKey(key));
        if (value !== null) {
          preferences[key] = value;
        }
      } catch (error) {
        console.error(`Error reading ${key}:`, error);
      }
    }

    return preferences;
  }

  async clearAll(): Promise<void> {
    if (this.storage.getAllKeys && this.storage.multiRemove) {
      try {
        // Use multi-remove if available (more efficient)
        const allKeys = await this.storage.getAllKeys();
        const keysToRemove = allKeys.filter(key => key.startsWith(this.prefix));

        if (keysToRemove.length > 0) {
          await this.storage.multiRemove(keysToRemove);
        }
      } catch (error) {
        console.error('Error clearing all preferences:', error);
      }
    } else {
      // Fall back to removing keys one by one
      const keys = [
        'lastCheckTime',
        'remindLaterTime',
        'dismissCount',
        'lastShownVersion',
        'autoUpdateEnabled'
      ];

      for (const key of keys) {
        try {
          await this.storage.removeItem(this.getKey(key));
        } catch (error) {
          console.error(`Error removing ${key}:`, error);
        }
      }
    }
  }
}