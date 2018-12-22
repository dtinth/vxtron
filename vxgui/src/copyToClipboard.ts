import { isElectronMode } from './environment'

export function copyToClipboard(text: string) {
  if (isElectronMode) {
    const { clipboard } = (global as any).require('electron')
    clipboard.writeText(text)
  } else {
    console.log('%cCopy: %s', 'font-weight:bold;font-size:24px;', text)
  }
}
