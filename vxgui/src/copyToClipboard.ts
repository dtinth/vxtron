import { isElectronMode } from './environment'

export function copyToClipboard(text: string) {
  console.log('%cCopy: %s', 'font-weight:bold;font-size:24px;', text)
  if (isElectronMode) {
    const { clipboard } = (global as any).require('electron')
    clipboard.writeText(text)
  } else {
    const copy = (window as any).copy
    if (typeof copy === 'function') {
      copy(text)
    } else {
      console.log(
        'Pro-tip: Run this in JS console to enable clipboard integration:\n\n    ' +
          "copy('...'); Object.assign(window, { copy })"
      )
    }
  }
}
