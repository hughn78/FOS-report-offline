import { contextBridge, ipcRenderer } from "electron";

const api = {
  db: {
    report: {
      list: () => ipcRenderer.invoke("db:report:list"),
      get: (id: number) => ipcRenderer.invoke("db:report:get", id),
      create: (report: any) => ipcRenderer.invoke("db:report:create", report),
      delete: (id: number) => ipcRenderer.invoke("db:report:delete", id),
    },
  },
  dialog: {
    openFile: (options: any) => ipcRenderer.invoke("dialog:open-file", options),
    saveFile: (options: any, buffer: number[]) => ipcRenderer.invoke("dialog:save-file", options, buffer),
  },
  app: {
    info: () => ipcRenderer.invoke("app:info"),
  },
};

contextBridge.exposeInMainWorld("electronAPI", api);

export type ElectronAPI = typeof api;
