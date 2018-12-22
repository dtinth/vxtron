const electron = require('electron')
const { app, globalShortcut, BrowserWindow, ipcMain } = require('electron')

function createWindow() {
  const { width } = electron.screen.getPrimaryDisplay().workAreaSize
  const win = (global.window = new BrowserWindow({
    x: 0,
    y: 120,
    width: width,
    height: 480,
    frame: false,
    transparent: true
  }))
  // win.loadURL('http://localhost:3000/?electron=1')
  win.loadFile('vxgui/build/index.html')
  win.setAlwaysOnTop(true, 'status')
  win.setIgnoreMouseEvents(true)
  let currentListenProcess
  ipcMain.on('listen', (event, options) => {
    console.log('[main] Start listen')
    currentListenProcess = require('./speech')(options, message => {
      console.log('[main] Got message', message)
      event.sender.send('listen-event', message)
    })
  })
  ipcMain.on('stop', event => {
    if (currentListenProcess) {
      currentListenProcess.stop()
      currentListenProcess = null
    }
  })
  globalShortcut.register('Command+Shift+Up', () => {
    win.webContents.send('recall-previous-command')
  })
  globalShortcut.register('Command+Shift+Down', () => {
    win.webContents.send('recall-next-command')
  })
  globalShortcut.register('Command+Shift+L', () => {
    win.webContents.send('listen-command', {
      language: 'en-US'
    })
  })
  globalShortcut.register('Command+Alt+Shift+L', () => {
    win.webContents.send('listen-command', {
      language: 'th'
    })
  })
}

app.on('ready', createWindow)
