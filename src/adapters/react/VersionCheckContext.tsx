/**
 * React Context and Provider for version checking
 * Framework-agnostic implementation that works with any data/storage providers
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import { VersionChecker } from '../../core/version-checker';
import { VersionInfo, VersionCheckOptions } from '../../core/types';
import { IVersionDataProvider } from '../../providers/data-provider.interface';
import { IStorageProvider } from '../../providers/storage-provider.interface';

/**
 * Version check context value
 */
export interface VersionCheckContextValue {
  /** Current version information */
  versionInfo: VersionInfo | null;
  /** Whether an update is available */
  isUpdateAvailable: boolean;
  /** Current app version */
  currentVersion: string | null;
  /** Formatted version string */
  formattedVersion: string | null;
  /** Whether the update dialog should be shown */
  showUpdateDialog: boolean;
  /** Whether a check is in progress */
  isChecking: boolean;
  /** Any error that occurred during checking */
  error: Error | null;
  /** Manually trigger a version check */
  checkForUpdates: () => Promise<void>;
  /** Handle update now action */
  handleUpdateNow: () => Promise<void>;
  /** Handle remind later action */
  handleRemindLater: () => Promise<void>;
  /** Reset version check data */
  resetVersionCheck: () => Promise<void>;
  /** Get changelog for latest version */
  getChangeLog: () => Promise<string | null>;
  /** Check if update is mandatory */
  isUpdateMandatory: () => Promise<boolean>;
}

const VersionCheckContext = createContext<VersionCheckContextValue | undefined>(undefined);

/**
 * Props for VersionCheckProvider
 */
export interface VersionCheckProviderProps {
  children: ReactNode;
  /** Data provider for version information */
  dataProvider: IVersionDataProvider;
  /** Storage provider for preferences */
  storageProvider: IStorageProvider;
  /** Optional version check options */
  options?: VersionCheckOptions;
  /** Whether to check for updates automatically on mount */
  checkOnMount?: boolean;
  /** Whether to check for updates when app becomes active (React Native) */
  checkOnForeground?: boolean;
  /** Custom handler for opening the app store */
  onOpenStore?: (url: string) => Promise<void>;
  /** Callback when update dialog should be shown */
  onShowUpdateDialog?: (versionInfo: VersionInfo) => void;
  /** Callback when update dialog should be hidden */
  onHideUpdateDialog?: () => void;
  /** Whether to render the update dialog internally (set to false if using custom dialog) */
  renderDialog?: boolean;
  /** Custom update dialog component */
  dialogComponent?: React.ComponentType<UpdateDialogProps>;
}

/**
 * Props for update dialog components
 */
export interface UpdateDialogProps {
  visible: boolean;
  versionInfo: VersionInfo;
  onUpdateNow: () => Promise<void>;
  onRemindLater: () => Promise<void>;
  isUpdateMandatory?: boolean;
  changeLog?: string | null;
}

/**
 * Version Check Provider Component
 */
export const VersionCheckProvider: React.FC<VersionCheckProviderProps> = ({
  children,
  dataProvider,
  storageProvider,
  options = {},
  checkOnMount = true,
  checkOnForeground = false,
  onOpenStore,
  onShowUpdateDialog,
  onHideUpdateDialog,
  renderDialog = true,
  dialogComponent: DialogComponent,
}) => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [formattedVersion, setFormattedVersion] = useState<string | null>(null);

  // Create version checker instance
  const versionChecker = useMemo(
    () => new VersionChecker(dataProvider, storageProvider, options),
    [dataProvider, storageProvider, options]
  );

  // Initialize version checker
  useEffect(() => {
    versionChecker.initialize().catch(console.error);

    return () => {
      versionChecker.dispose().catch(console.error);
    };
  }, [versionChecker]);

  // Get initial version info
  useEffect(() => {
    const loadVersions = async () => {
      try {
        const current = await dataProvider.getCurrentVersion();
        setCurrentVersion(current);

        const formatted = dataProvider.getFormattedVersion
          ? await dataProvider.getFormattedVersion()
          : current;
        setFormattedVersion(formatted);
      } catch (err) {
        console.error('Error loading versions:', err);
      }
    };

    loadVersions();
  }, [dataProvider]);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    if (isChecking) return;

    setIsChecking(true);
    setError(null);

    try {
      const result = await versionChecker.shouldShowUpdatePrompt();
      const info = result.versionInfo;

      setVersionInfo(info);

      if (result.shouldShowPrompt) {
        setShowUpdateDialog(true);
        onShowUpdateDialog?.(info);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Error checking for updates:', error);
    } finally {
      setIsChecking(false);
    }
  }, [versionChecker, isChecking, onShowUpdateDialog]);

  // Handle update now
  const handleUpdateNow = useCallback(async () => {
    setShowUpdateDialog(false);
    onHideUpdateDialog?.();

    if (versionInfo?.storeUrl) {
      if (onOpenStore) {
        await onOpenStore(versionInfo.storeUrl);
      } else {
        // Default behavior - open URL in browser
        if (typeof window !== 'undefined' && window.open) {
          window.open(versionInfo.storeUrl, '_blank');
        }
      }
    }
  }, [versionInfo, onOpenStore, onHideUpdateDialog]);

  // Handle remind later
  const handleRemindLater = useCallback(async () => {
    setShowUpdateDialog(false);
    onHideUpdateDialog?.();

    await versionChecker.setRemindMeLater();
  }, [versionChecker, onHideUpdateDialog]);

  // Reset version check data
  const resetVersionCheck = useCallback(async () => {
    await versionChecker.resetVersionCheckData();
    setVersionInfo(null);
    setShowUpdateDialog(false);
    setError(null);
  }, [versionChecker]);

  // Get change log
  const getChangeLog = useCallback(async () => {
    return await versionChecker.getChangeLog();
  }, [versionChecker]);

  // Check if update is mandatory
  const isUpdateMandatory = useCallback(async () => {
    return await versionChecker.isUpdateMandatory();
  }, [versionChecker]);

  // Check on mount if enabled
  useEffect(() => {
    if (checkOnMount) {
      checkForUpdates();
    }
  }, [checkOnMount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Setup foreground checking for React Native (optional)
  useEffect(() => {
    if (!checkOnForeground) return;

    // This would be implemented by the consumer for React Native
    // Example: using AppState.addEventListener('change', ...)
    // We'll provide a hook for this
  }, [checkOnForeground, checkForUpdates]);

  // Context value
  const contextValue: VersionCheckContextValue = useMemo(
    () => ({
      versionInfo,
      isUpdateAvailable: versionInfo?.updateAvailable || false,
      currentVersion,
      formattedVersion,
      showUpdateDialog,
      isChecking,
      error,
      checkForUpdates,
      handleUpdateNow,
      handleRemindLater,
      resetVersionCheck,
      getChangeLog,
      isUpdateMandatory,
    }),
    [
      versionInfo,
      currentVersion,
      formattedVersion,
      showUpdateDialog,
      isChecking,
      error,
      checkForUpdates,
      handleUpdateNow,
      handleRemindLater,
      resetVersionCheck,
      getChangeLog,
      isUpdateMandatory,
    ]
  );

  return (
    <VersionCheckContext.Provider value={contextValue}>
      {children}
      {renderDialog && DialogComponent && versionInfo && (
        <DialogComponent
          visible={showUpdateDialog}
          versionInfo={versionInfo}
          onUpdateNow={handleUpdateNow}
          onRemindLater={handleRemindLater}
        />
      )}
    </VersionCheckContext.Provider>
  );
};

/**
 * Hook to use version check context
 */
export const useVersionCheck = () => {
  const context = useContext(VersionCheckContext);
  if (context === undefined) {
    throw new Error('useVersionCheck must be used within a VersionCheckProvider');
  }
  return context;
};