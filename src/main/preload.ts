import {contextBridge, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getSeededAttendees: (eventSlug: string) => ipcRenderer.invoke('startgg:get-seeded-attendees', eventSlug)
})
