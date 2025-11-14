/**
 * React hooks for version checking
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { VersionChecker } from '../../core/version-checker';
import { VersionInfo } from '../../core/types';
import { IVersionDataProvider } from '../../providers/data-provider.interface';
import { IStorageProvider } from '../../providers/storage-provider.interface';
import { useVersionCheck } from './VersionCheckContext';

/**
 * Hook for checking app state changes (React Native)
 * This is a helper for React Native apps to check on foreground
 */
export const useAppStateVersionCheck = (
  appStateModule?: any, // React Native's AppState module
  enabled: boolean = true
) => {
  const { checkForUpdates } = useVersionCheck();
  const [appState, setAppState] = useState<string>('active');

  useEffect(() => {
    if (!enabled || !appStateModule) return;

    const currentState = appStateModule.currentState || 'active';
    setAppState(currentState);

    const handleAppStateChange = (nextAppState: string) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground
        checkForUpdates();
      }
      setAppState(nextAppState);
    };

    const subscription = appStateModule.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove?.();
    };
  }, [appState, checkForUpdates, enabled, appStateModule]);

  return appState;
};

/**
 * Hook for periodic version checking
 */
export const usePeriodicVersionCheck = (
  intervalMs: number = 60 * 60 * 1000, // Default: 1 hour
  enabled: boolean = true
) => {
  const { checkForUpdates } = useVersionCheck();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Setup interval
    intervalRef.current = setInterval(() => {
      checkForUpdates();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkForUpdates, intervalMs, enabled]);
};

/**
 * Hook for visibility-based version checking (web)
 */
export const useVisibilityVersionCheck = (enabled: boolean = true) => {
  const { checkForUpdates } = useVersionCheck();

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdates, enabled]);
};

/**
 * Standalone hook for version checking without context
 * Useful when you want to manage the version checking logic yourself
 */
export const useStandaloneVersionChecker = (
  dataProvider: IVersionDataProvider,
  storageProvider: IStorageProvider,
  options?: {
    checkOnMount?: boolean;
    checkOnFocus?: boolean;
    checkInterval?: number;
  }
) => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  const versionCheckerRef = useRef<VersionChecker | null>(null);

  // Initialize version checker
  useEffect(() => {
    const checker = new VersionChecker(dataProvider, storageProvider);
    versionCheckerRef.current = checker;

    checker.initialize().catch(console.error);

    return () => {
      checker.dispose().catch(console.error);
    };
  }, [dataProvider, storageProvider]);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    if (!versionCheckerRef.current || isChecking) return;

    setIsChecking(true);
    setError(null);

    try {
      const result = await versionCheckerRef.current.shouldShowUpdatePrompt();
      setVersionInfo(result.versionInfo);
      setShowUpdatePrompt(result.shouldShowPrompt);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  // Handle remind later
  const setRemindMeLater = useCallback(async () => {
    if (!versionCheckerRef.current) return;

    await versionCheckerRef.current.setRemindMeLater();
    setShowUpdatePrompt(false);
  }, []);

  // Check on mount
  useEffect(() => {
    if (options?.checkOnMount !== false) {
      checkForUpdates();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check on focus
  useEffect(() => {
    if (!options?.checkOnFocus) return;

    const handleFocus = () => checkForUpdates();

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkForUpdates, options?.checkOnFocus]);

  // Periodic checking
  useEffect(() => {
    if (!options?.checkInterval) return;

    const interval = setInterval(checkForUpdates, options.checkInterval);
    return () => clearInterval(interval);
  }, [checkForUpdates, options?.checkInterval]);

  return {
    versionInfo,
    isChecking,
    error,
    showUpdatePrompt,
    checkForUpdates,
    setRemindMeLater,
    isUpdateAvailable: versionInfo?.updateAvailable || false,
  };
};

/**
 * Hook to get just the version info
 */
export const useVersionInfo = () => {
  const { versionInfo, currentVersion, formattedVersion } = useVersionCheck();

  return {
    current: currentVersion,
    latest: versionInfo?.latestVersion,
    formatted: formattedVersion,
    updateAvailable: versionInfo?.updateAvailable || false,
    platform: versionInfo?.platform,
    storeUrl: versionInfo?.storeUrl,
  };
};

/**
 * Hook to get update status
 */
export const useUpdateStatus = () => {
  const { isUpdateAvailable, isChecking, error, showUpdateDialog } = useVersionCheck();

  return {
    isUpdateAvailable,
    isChecking,
    hasError: !!error,
    error,
    isDialogVisible: showUpdateDialog,
  };
};