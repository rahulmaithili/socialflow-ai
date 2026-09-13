export interface ElectronCapturedAccount {
  fbUserId: string;
  sessionId: string;
  name: string;
  picture?: string;
  connectedAt: string;
}

export interface ElectronAPI {
  isElectron: boolean;
  openFacebookBrowser: (options?: { sessionId?: string; accountName?: string }) => Promise<{ success: boolean; sessionId: string; status: string }>;
  closeFacebookBrowser: (sessionId?: string) => Promise<boolean>;
  getActiveSessions: () => Promise<string[]>;
  onFacebookAccountCaptured: (callback: (account: ElectronCapturedAccount) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
