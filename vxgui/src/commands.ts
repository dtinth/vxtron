import hotkeys from 'hotkeys-js'
import { AppCommands } from './AppCommands'
import { isElectronMode } from './environment'

export function listenToCommand(delegate: AppCommands) {
  if (isElectronMode) {
    const { ipcRenderer } = (global as any).require('electron')
    ipcRenderer.on('listen-command', (event: any, message: any) => {
      delegate.requestListening(message)
    })
    ipcRenderer.on('recall-previous-command', (event: any, message: any) => {
      delegate.recallPrevious()
    })
    ipcRenderer.on('recall-next-command', (event: any, message: any) => {
      delegate.recallNext()
    })
  } else {
    hotkeys('cmd+shift+l', function(event, handler) {
      event.preventDefault()
      delegate.requestListening({
        language: 'en-US'
      })
    })
    hotkeys('cmd+alt+shift+l', function(event, handler) {
      event.preventDefault()
      delegate.requestListening({
        language: 'th'
      })
    })
    hotkeys('cmd+shift+up', function(event, handler) {
      event.preventDefault()
      delegate.recallPrevious()
    })
    hotkeys('cmd+shift+down', function(event, handler) {
      event.preventDefault()
      delegate.recallNext()
    })
  }
  return () => {}
}
