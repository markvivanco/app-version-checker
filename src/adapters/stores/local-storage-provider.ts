/**
 * LocalStorage implementation of IStorageProvider
 * For use in web browsers
 */

import { BaseStorageProvider } from '../../providers/storage-provider.interface';

export class LocalStorageProvider extends BaseStorageProvider {
  private readonly prefix: string;

  constructor(prefix: string = 'app_version_check_') {
    super();
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async getLastCheckTime(): Promise<number | null> {
    try {
      const value = localStorage.getItem(this.getKey('lastCheckTime'));
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      console.error('Error reading last check time:', error);
      return null;
    }
  }

  async setLastCheckTime(timestamp: number): Promise<void> {
    try {
      localStorage.setItem(this.getKey('lastCheckTime'), timestamp.toString());
    } catch (error) {
      console.error('Error setting last check time:', error);
    }
  }

  async getRemindLaterTime(): Promise<number | null> {
    try {
      const value = localStorage.getItem(this.getKey('remindLaterTime'));
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      console.error('Error reading remind later time:', error);
      return null;
    }
  }

  async setRemindLaterTime(timestamp: number): Promise<void> {
    try {
      localStorage.setItem(this.getKey('remindLaterTime'), timestamp.toString());
    } catch (error) {
      console.error('Error setting remind later time:', error);
    }
  }

  async clearRemindLaterTime(): Promise<void> {
    try {
      localStorage.removeItem(this.getKey('remindLaterTime'));
    } catch (error) {
      console.error('Error clearing remind later time:', error);
    }
  }

  async getDismissCount(): Promise<number> {
    try {
      const value = localStorage.getItem(this.getKey('dismissCount'));
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      console.error('Error reading dismiss count:', error);
      return 0;
    }
  }

  async incrementDismissCount(): Promise<void> {
    try {
      const current = await this.getDismissCount();
      localStorage.setItem(this.getKey('dismissCount'), (current + 1).toString());
    } catch (error) {
      console.error('Error incrementing dismiss count:', error);
    }
  }

  async getLastShownVersion(): Promise<string | null> {
    try {
      return localStorage.getItem(this.getKey('lastShownVersion'));
    } catch (error) {
      console.error('Error reading last shown version:', error);
      return null;
    }
  }

  async setLastShownVersion(version: string): Promise<void> {
    try {
      localStorage.setItem(this.getKey('lastShownVersion'), version);
    } catch (error) {
      console.error('Error setting last shown version:', error);
    }
  }

  async getAutoUpdateEnabled(): Promise<boolean> {
    try {
      const value = localStorage.getItem(this.getKey('autoUpdateEnabled'));
      return value === 'true';
    } catch (error) {
      console.error('Error reading auto update preference:', error);
      return false;
    }
  }

  async setAutoUpdateEnabled(enabled: boolean): Promise<void> {
    try {
      localStorage.setItem(this.getKey('autoUpdateEnabled'), enabled.toString());
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
        const value = localStorage.getItem(this.getKey(key));
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
    const keysToRemove: string[] = [];

    // Find all keys with our prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }

    // Remove all found keys
    for (const key of keysToRemove) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removing ${key}:`, error);
      }
    }
  }
}