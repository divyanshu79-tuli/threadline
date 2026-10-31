const { app, BrowserWindow, ipcMain, safeStorage, Notification } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const reminderTimers = new Map();

function configPath() { return path.join(app.getPath('userData'), 'tracker-endpoint.bin'); }
function readEndpoint() {
  try {
    const data = fs.readFileSync(configPath());
    return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(data) : data.toString();
  } catch { return ''; }
}

ipcMain.handle('tracker:get-endpoint', () => readEndpoint());
ipcMain.handle('tracker:set-endpoint', (_event, value) => {
  const endpoint = String(value || '').trim();
  if (endpoint) {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      throw new Error('Use an HTTPS webhook URL (HTTP is allowed for localhost).');
    }
    const bytes = safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(endpoint) : Buffer.from(endpoint);
    fs.writeFileSync(configPath(), bytes, { mode: 0o600 });
  } else {
    try { fs.unlinkSync(configPath()); } catch {}
  }
  return { connected: Boolean(endpoint) };
});
ipcMain.handle('tracker:post-task', async (_event, task) => {
  const endpoint = readEndpoint();
  if (!endpoint) throw new Error('Connect a task tracker webhook in Settings first.');
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: task.text, assignee: task.owner, dueDate: task.due, sourceMeeting: task.meeting, source: 'Threadline' })
  });
  if (!response.ok) throw new Error(`Tracker returned HTTP ${response.status}.`);
  return { posted: true };
});
ipcMain.handle('reminder:schedule', (_event, task) => {
  const id = String(task.id || '');
  if (task.enabled === false) { clearTimeout(reminderTimers.get(id)); reminderTimers.delete(id); return { scheduled: false }; }
  if (!id || !task.due || task.due === 'No deadline set') return { scheduled: false };
  const match = String(task.due).match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
  if (!match) return { scheduled: false };
  const due = new Date(`${match[1]} ${match[2]}, ${match[3]} 09:00:00`);
  const ms = due.getTime() - 24 * 60 * 60 * 1000 - Date.now();
  if (ms <= 0 || ms > 2_147_000_000) return { scheduled: false };
  clearTimeout(reminderTimers.get(id));
  reminderTimers.set(id, setTimeout(() => {
    if (Notification.isSupported()) new Notification({ title: 'Threadline deadline reminder', body: `${task.text} · ${task.owner} · due ${task.due}` }).show();
    reminderTimers.delete(id);
  }, ms));
  return { scheduled: true };
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1480, height: 960, minWidth: 1120, minHeight: 720,
    backgroundColor: '#f7f8fa', title: 'Threadline',
    webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, 'preload.js') }
  });
  win.loadFile(path.join(__dirname, 'index.html'));
}
app.whenReady().then(() => { createWindow(); app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
