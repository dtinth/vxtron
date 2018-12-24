const electron = require('electron')
const configuration = require('./configuration')
const { app, globalShortcut, BrowserWindow, ipcMain } = require('electron')
const getSpeechProvider = require('./speech')
const speechProvider = getSpeechProvider(
  configuration.speechProvider,
  configuration.speechProviderOptions || {}
)

function createWindow() {
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize
  const win = new BrowserWindow({
    x: 0,
    y: height - 240,
    width: width,
    height: 240,
    frame: false,
    transparent: true,
    hasShadow: false
  })
  Object.assign(global, { window: win })
  if (process.env.VX_DEV === '1') {
    win.loadURL('http://localhost:3000/?electron=1')
  } else {
    win.loadFile('vxgui/build/index.html')
  }
  win.setAlwaysOnTop(true, 'status')
  win.setIgnoreMouseEvents(true)
  let currentListenProcess
  ipcMain.on('listen', (event, options) => {
    console.log('[main] Start listen')
    currentListenProcess = speechProvider.startListening(options, message => {
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
