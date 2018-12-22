import { isElectronMode } from './environment'

export interface VoiceListener {
  startListening(listeningOptions: ListeningOptions): void
  stopListening(): void
  isActive(): boolean
}

export interface ListeningOptions {
  language: string
}

export interface ListenDelegate {
  onListeningStarted(expiryTime?: number): void
  onListeningStopped(): void
  onTranscript(transcript: string, isFinal: boolean): void
  onError(message: string): void
}
export function createVoiceListener(delegate: ListenDelegate): VoiceListener {
  if (isElectronMode) {
    return createGoogleCloudPlatformVoiceListener(delegate)
  } else {
    return createBrowserVoiceListener(delegate)
  }
}

export function createBrowserVoiceListener(
  delegate: ListenDelegate
): VoiceListener {
  var recognition = new (window as any).webkitSpeechRecognition()
  var listening = false
  recognition.continuous = true
  recognition.interimResults = true

  recognition.onstart = function() {
    delegate.onListeningStarted()
  }

  recognition.onerror = function(event: any) {
    if (event.error === 'no-speech') {
      listening = false
      delegate.onListeningStopped()
    }
    if (event.error === 'audio-capture') {
      delegate.onError('No microphone was found.')
    }
    if (event.error === 'not-allowed') {
      delegate.onError('Permission to use microphone is blocked.')
    }
  }

  recognition.onend = function() {
    listening = false
    delegate.onListeningStopped()
  }

  recognition.onresult = function(event: any) {
    var finalTranscript = ''
    var interimTranscript = ''
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript
      } else {
        interimTranscript += event.results[i][0].transcript
      }
    }
    if (interimTranscript) {
      delegate.onTranscript(interimTranscript, false)
    }
    if (finalTranscript) {
      delegate.onTranscript(finalTranscript, true)
    }
  }

  return {
    startListening(options) {
      recognition.lang = options.language
      recognition.start()
      listening = true
    },
    stopListening() {
      recognition.stop()
    },
    isActive() {
      return listening
    }
  }
}

export function createGoogleCloudPlatformVoiceListener(
  delegate: ListenDelegate
): VoiceListener {
  const { ipcRenderer } = (global as any).require('electron')
  let active = false
  ipcRenderer.on('listen-event', (event: any, message: any) => {
    if (message.type === 'result') {
      delegate.onTranscript(
        message.result.alternatives[0].transcript,
        message.result.isFinal
      )
    } else if (message.type === 'end') {
      delegate.onListeningStopped()
    } else if (message.type === 'ready') {
      delegate.onListeningStarted(message.expiryTime)
    }
  })
  return {
    startListening(options) {
      if (!active) {
        ipcRenderer.send('listen', options)
        active = true
      }
    },
    stopListening() {
      if (active) {
        ipcRenderer.send('stop')
        active = false
      }
    },
    isActive() {
      return active
    }
  }
}
