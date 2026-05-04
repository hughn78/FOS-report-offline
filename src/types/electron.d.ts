export interface ElectronAPI {
  db: {
    report: {
      list: () => Promise<any[]>;
      get: (id: number) => Promise<any | null>;
      create: (report: any) => Promise<number>;
      delete: (id: number) => Promise<boolean>;
    };
  };
  dialog: {
    openFile: (options: any) => Promise<{ canceled: boolean; filePath?: string; name?: string; buffer?: number[] }>;
    saveFile: (options: any, buffer: number[]) => Promise<{ canceled: boolean; filePath?: string }>;
  };
  app: {
    info: () => Promise<{ version: string; platform: string }>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
