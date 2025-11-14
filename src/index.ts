/**
 * Main entry point for app-version-checker package
 */

// Core exports
export * from './core/types';
export * from './core/version-compare';
export * from './core/version-formatter';
export * from './core/stores';
export { VersionChecker } from './core/version-checker';

// Provider interfaces
export * from './providers/data-provider.interface';
export * from './providers/storage-provider.interface';

// Store adapters
export { LocalStorageProvider } from './adapters/stores/local-storage-provider';
export { AsyncStorageProvider, type IAsyncStorage } from './adapters/stores/async-storage-provider';

// React adapters (optional - only if React is available)
export * from './adapters/react/VersionCheckContext';
export * from './adapters/react/hooks';