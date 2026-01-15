import * as SecureStore from 'expo-secure-store';
import { AppState, AppStateStatus } from 'react-native';

const APP_LOCK_PASSWORD = 'Sepl@2026';
const APP_LOCK_KEY = 'app_lock_status';
const MAX_ATTEMPTS = 5;
const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export interface AppLockStatus {
  isLocked: boolean;
  lastUnlockTime: number;
  failedAttempts: number;
  isTemporarilyLocked: boolean;
}

class AppLockService {
  private static instance: AppLockService;
  private appState: AppStateStatus = 'active';
  private lockStatusListeners: ((locked: boolean) => void)[] = [];

  private constructor() {
    this.setupAppStateListener();
  }

  static getInstance(): AppLockService {
    if (!AppLockService.instance) {
      AppLockService.instance = new AppLockService();
    }
    return AppLockService.instance;
  }

  /**
   * Setup app state listener to lock app when backgrounded
   */
  private setupAppStateListener() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to foreground - lock it
      this.lockApp();
    }
    this.appState = nextAppState;
  };

  /**
   * Lock the app
   */
  async lockApp(): Promise<void> {
    try {
      const status: AppLockStatus = {
        isLocked: true,
        lastUnlockTime: 0,
        failedAttempts: 0,
        isTemporarilyLocked: false,
      };
      await SecureStore.setItemAsync(APP_LOCK_KEY, JSON.stringify(status));
      this.notifyLockStatusChange(true);
    } catch (error) {
      console.error('Error locking app:', error);
    }
  }

  /**
   * Unlock the app with password
   */
  async unlockApp(password: string): Promise<boolean> {
    try {
      // Check if temporarily locked
      const status = await this.getLockStatus();

      if (status.isTemporarilyLocked) {
        const timeSinceLock = Date.now() - status.lastUnlockTime;
        if (timeSinceLock < LOCK_TIMEOUT) {
          throw new Error(
            `Too many failed attempts. Try again in ${Math.ceil((LOCK_TIMEOUT - timeSinceLock) / 1000)} seconds`
          );
        }
      }

      // Verify password
      if (password !== APP_LOCK_PASSWORD) {
        // Increment failed attempts
        status.failedAttempts += 1;

        if (status.failedAttempts >= MAX_ATTEMPTS) {
          status.isTemporarilyLocked = true;
          status.lastUnlockTime = Date.now();
        }

        await SecureStore.setItemAsync(APP_LOCK_KEY, JSON.stringify(status));
        throw new Error(`Incorrect password. ${MAX_ATTEMPTS - status.failedAttempts} attempts remaining`);
      }

      // Correct password - unlock app
      const unlockedStatus: AppLockStatus = {
        isLocked: false,
        lastUnlockTime: Date.now(),
        failedAttempts: 0,
        isTemporarilyLocked: false,
      };

      await SecureStore.setItemAsync(APP_LOCK_KEY, JSON.stringify(unlockedStatus));
      this.notifyLockStatusChange(false);
      return true;
    } catch (error) {
      console.error('Error unlocking app:', error);
      throw error;
    }
  }

  /**
   * Get current lock status
   */
  async getLockStatus(): Promise<AppLockStatus> {
    try {
      const statusStr = await SecureStore.getItemAsync(APP_LOCK_KEY);

      if (!statusStr) {
        // First time - don't lock, just initialize
        const initialStatus: AppLockStatus = {
          isLocked: false,
          lastUnlockTime: Date.now(),
          failedAttempts: 0,
          isTemporarilyLocked: false,
        };
        await SecureStore.setItemAsync(APP_LOCK_KEY, JSON.stringify(initialStatus));
        return initialStatus;
      }

      return JSON.parse(statusStr) as AppLockStatus;
    } catch (error) {
      console.error('Error getting lock status:', error);
      return {
        isLocked: false,
        lastUnlockTime: Date.now(),
        failedAttempts: 0,
        isTemporarilyLocked: false,
      };
    }
  }

  /**
   * Check if app is locked
   */
  async isAppLocked(): Promise<boolean> {
    const status = await this.getLockStatus();
    return status.isLocked;
  }

  /**
   * Get remaining attempts
   */
  async getRemainingAttempts(): Promise<number> {
    const status = await this.getLockStatus();
    return Math.max(0, MAX_ATTEMPTS - status.failedAttempts);
  }

  /**
   * Check if temporarily locked
   */
  async isTemporarilyLocked(): Promise<boolean> {
    const status = await this.getLockStatus();

    if (!status.isTemporarilyLocked) {
      return false;
    }

    // Check if lock timeout has expired
    const timeSinceLock = Date.now() - status.lastUnlockTime;
    if (timeSinceLock >= LOCK_TIMEOUT) {
      // Reset lock
      status.isTemporarilyLocked = false;
      status.failedAttempts = 0;
      await SecureStore.setItemAsync(APP_LOCK_KEY, JSON.stringify(status));
      return false;
    }

    return true;
  }

  /**
   * Get lock timeout remaining in seconds
   */
  async getLockTimeoutRemaining(): Promise<number> {
    const status = await this.getLockStatus();

    if (!status.isTemporarilyLocked) {
      return 0;
    }

    const timeSinceLock = Date.now() - status.lastUnlockTime;
    const remaining = Math.max(0, LOCK_TIMEOUT - timeSinceLock);
    return Math.ceil(remaining / 1000);
  }

  /**
   * Subscribe to lock status changes
   */
  onLockStatusChange(callback: (locked: boolean) => void): () => void {
    this.lockStatusListeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.lockStatusListeners = this.lockStatusListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of lock status change
   */
  private notifyLockStatusChange(locked: boolean) {
    this.lockStatusListeners.forEach(callback => {
      try {
        callback(locked);
      } catch (error) {
        console.error('Error in lock status listener:', error);
      }
    });
  }

  /**
   * Reset app lock (for testing/admin purposes)
   */
  async resetLock(): Promise<void> {
    try {
      const status: AppLockStatus = {
        isLocked: true,
        lastUnlockTime: 0,
        failedAttempts: 0,
        isTemporarilyLocked: false,
      };
      await SecureStore.setItemAsync(APP_LOCK_KEY, JSON.stringify(status));
    } catch (error) {
      console.error('Error resetting lock:', error);
    }
  }
}

export const appLockService = AppLockService.getInstance();
