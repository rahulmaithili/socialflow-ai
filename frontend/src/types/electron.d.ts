export interface DiscoveredPage {
  name: string;
  pageId?: string;
  category?: string;
}

export interface DiscoveredGroup {
  name: string;
  groupId?: string;
  category?: string;
}

export interface ElectronCapturedAccount {
  fbUserId: string;
  sessionId: string;
  name: string;
  picture?: string;
  pages?: DiscoveredPage[];
  groups?: DiscoveredGroup[];
  proxy?: string;
  connectedAt: string;
}

export interface ElectronCapturedInstagram {
  igUserId: string;
  username: string;
  name: string;
  picture?: string;
  proxy?: string;
  connectedAt: string;
}

export interface AppUpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string | string[];
  releaseName?: string;
}

export interface AppUpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export interface ElectronAPI {
  isElectron: boolean;
  openFacebookBrowser: (options?: { sessionId?: string; accountName?: string; proxy?: string }) => Promise<{ success: boolean; sessionId: string; status: string }>;
  openInstagramBrowser: (options?: { sessionId?: string; accountName?: string; proxy?: string }) => Promise<{ success: boolean; sessionId: string; status: string }>;
  openAccountSession?: (options?: { sessionId?: string; accountName?: string; platform?: string; proxy?: string }) => Promise<any>;
  closeFacebookBrowser: (sessionId?: string) => Promise<boolean>;
  closeInstagramBrowser?: (sessionId?: string) => Promise<boolean>;
  getActiveSessions: () => Promise<string[]>;
  onFacebookAccountCaptured: (callback: (account: ElectronCapturedAccount) => void) => () => void;
  onInstagramAccountCaptured?: (callback: (account: ElectronCapturedInstagram) => void) => () => void;

  // Auto Updater
  checkForUpdates?: () => Promise<{ status: string; message?: string; updateInfo?: any }>;
  startDownloadUpdate?: () => Promise<{ status: string; message?: string }>;
  installUpdateNow?: () => Promise<void>;
  getAppVersion?: () => Promise<string>;
  getMachineId?: () => Promise<string>;
  onUpdateChecking?: (callback: () => void) => () => void;
  onUpdateAvailable?: (callback: (info: AppUpdateInfo) => void) => () => void;
  onUpdateNotAvailable?: (callback: (info: { version: string }) => void) => () => void;
  onUpdateProgress?: (callback: (progress: AppUpdateProgress) => void) => () => void;
  onUpdateDownloaded?: (callback: (info: { version: string }) => void) => () => void;
  onUpdateError?: (callback: (errorMsg: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
