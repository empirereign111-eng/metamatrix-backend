export interface ElectronAPI {
  invoke: (channel: string, data?: any) => Promise<any>;
  on: (channel: string, listener: (data: any) => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
