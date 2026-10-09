import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('openrouterDemo', {
  runWeatherDemo: () => ipcRenderer.invoke('openrouter:runWeatherDemo'),
});
