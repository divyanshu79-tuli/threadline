const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('threadline', {
  getTrackerEndpoint: () => ipcRenderer.invoke('tracker:get-endpoint'),
  setTrackerEndpoint: value => ipcRenderer.invoke('tracker:set-endpoint', value),
  postApprovedTask: task => ipcRenderer.invoke('tracker:post-task', task),
  scheduleReminder: task => ipcRenderer.invoke('reminder:schedule', task)
});
