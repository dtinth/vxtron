import React, { useReducer, useEffect, useRef, Fragment } from 'react'
import ReactDOM from 'react-dom'
import { createGlobalStyle } from 'styled-components'
import { listenToCommand } from './commands'
import { actionTypes, actionType, actionHandler } from './redux-utils'
import { createVoiceListener, VoiceListener } from './voiceListener'
import './index.css'
import { copyToClipboard } from './copyToClipboard'
import { isElectronMode } from './environment'

const MicIcon = () => (
  <svg width="33px" height="47px" viewBox="0 0 33 47" version="1.1">
    <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g
        id="Artboard"
        transform="translate(-39.000000, -27.000000)"
        fill="currentColor"
      >
        <g id="Group" transform="translate(39.000000, 27.000000)">
          <rect id="Rectangle-4" x="9" y="43" width="16" height="4" />
          <rect id="Rectangle-4" x="15" y="36" width="4" height="9" />
          <rect id="Rectangle-2" x="9" y="0" width="16" height="30" rx="8" />
          <path
            d="M0.910752573,23 L4.9198303,23 C5.40030578,29.2193935 10.599172,34.1164063 16.9417969,34.1164063 C23.2844217,34.1164063 28.4832879,29.2193935 28.9637634,23 L32.9728412,23 C32.4852868,31.4303471 25.4943482,38.1164063 16.9417969,38.1164063 C8.38924552,38.1164063 1.39830697,31.4303471 0.910752573,23 Z"
            id="Combined-Shape"
          />
        </g>
      </g>
    </g>
  </svg>
)

const actions = actionTypes({
  /** When pressing the "Listen" button */
  ListeningRequested: actionType<{}>(),

  /** When speech recognition is ready */
  ListeningStarted: actionType<{
    expiryTime?: number
  }>(),

  /** Fires when listening finished or time up */
  ListeningFinished: actionType<{}>(),

  /** When receive transcript */
  TranscriptReceived: actionType<{
    transcript: string
    isFinal: boolean
    timestamp: number
  }>(),

  /** Fires when it is time to hide the display HUD */
  HideHUD: actionType<{}>(),

  /** When the user wants to recall the previously recognized text. */
  RecallPrevious: actionType<{}>(),

  /** When the user wants to go back to the next recognized text. */
  RecallNext: actionType<{}>()
})

type State = {
  status: 'idle' | 'listeningRequested' | 'listening'
  listeningExpiryTime?: number
  currentTranscript: string
  historyIndex: number
  history: {
    transcript: string
    timestamp: number
  }[]
}

const initialState: State = {
  status: 'idle',
  currentTranscript: '',
  historyIndex: 0,
  history: []
}

const reducer = actionHandler<State>()
  .handle(actions.ListeningRequested, (state, action) => {
    state.status = 'listeningRequested'
  })
  .handle(actions.ListeningStarted, (state, action) => {
    state.status = 'listening'
    state.listeningExpiryTime = action.expiryTime
  })
  .handle(actions.ListeningFinished, (state, action) => {
    state.status = 'idle'
    delete state.listeningExpiryTime
  })
  .handle(actions.RecallPrevious, (state, action) => {
    state.historyIndex = Math.max(0, state.historyIndex - 1)
  })
  .handle(actions.RecallNext, (state, action) => {
    state.historyIndex = Math.min(state.history.length, state.historyIndex + 1)
  })
  .handle(actions.HideHUD, (state, action) => {
    state.historyIndex = state.history.length
  })
  .handle(actions.TranscriptReceived, (state, action) => {
    if (action.isFinal) {
      state.history.push({
        timestamp: action.timestamp,
        transcript: action.transcript
      })
      state.historyIndex = state.history.length - 1
      state.currentTranscript = ''
    } else {
      state.currentTranscript = action.transcript
    }
  })
  .toReducer()

function wrapDispatch<T extends Function>(dispatch: T): T {
  return ((action: any) => {
    console.log('Fire action', action)
    return dispatch(action)
  }) as any
}

function App() {
  const [state, _dispatch] = useReducer(reducer, initialState)
  const listenerRef = useRef<VoiceListener>(null)
  const dispatch = wrapDispatch(_dispatch)

  useEffect(() => {
    ;(listenerRef as any).current = createVoiceListener({
      onError: message => console.error('Listening failed:', message),
      onListeningStarted: expiryTime =>
        dispatch(actions.ListeningStarted({ expiryTime })),
      onListeningStopped: () => dispatch(actions.ListeningFinished({})),
      onTranscript: (transcript, isFinal) => {
        dispatch(
          actions.TranscriptReceived({
            transcript,
            isFinal,
            timestamp: Date.now()
          })
        )
      }
    })
  }, [])

  useEffect(
    () =>
      listenToCommand({
        requestListening: options => {
          const listener = listenerRef.current
          if (listener) {
            if (listener.isActive()) {
              listener.stopListening()
            } else {
              dispatch(actions.ListeningRequested({}))
              listener.startListening(options)
            }
          }
        },
        recallPrevious: () => {
          dispatch(actions.RecallPrevious({}))
        },
        recallNext: () => {
          dispatch(actions.RecallNext({}))
        }
      }),
    []
  )

  const currentHistoryItem = state.history[state.historyIndex]
  const text =
    state.currentTranscript ||
    (currentHistoryItem && currentHistoryItem.transcript) ||
    ''
  const isFinished = !state.currentTranscript
  const shouldDisplay = !isFinished || text !== '' || state.status !== 'idle'
  const toHide =
    state.status === 'idle' && shouldDisplay
      ? `historyIndex=${state.historyIndex}`
      : null

  useEffect(
    () => {
      if (shouldDisplay && isFinished && text) {
        copyToClipboard(String(text).trim())
      }
    },
    [shouldDisplay && isFinished && text]
  )
  useEffect(
    () => {
      console.log('[toHide]', toHide)
      if (!toHide) return () => {}
      const hide = () => dispatch(actions.HideHUD({}))
      const timeout = setTimeout(hide, 5000)
      return () => clearTimeout(timeout)
    },
    [toHide]
  )

  return (
    <Fragment>
      <div
        className="AppView"
        data-visible={shouldDisplay ? '1' : '0'}
        data-status={state.status}
        data-finished={isFinished ? '1' : '0'}
      >
        {shouldDisplay && <AppVisible />}
        <div className="AppView-icon">
          <MicIcon />
        </div>
        {!!text && <div className="AppView-transcript">{text}</div>}
      </div>
      {!isElectronMode && <pre>{JSON.stringify(state, null, 2)}</pre>}
    </Fragment>
  )
}

function AppVisible() {
  useEffect(() => {
    if (isElectronMode) {
      const { remote } = (global as any).require('electron')
      remote.getCurrentWindow().setOpacity(1)
      return () => {
        remote.getCurrentWindow().setOpacity(0)
      }
    }
  }, [])
  return null
}

if (isElectronMode) {
  const { remote } = (global as any).require('electron')
  remote.getCurrentWindow().setOpacity(0)
}

function Main() {
  return (
    <div>
      <App />
    </div>
  )
}

if (isElectronMode) {
  document.documentElement.setAttribute('data-electron', '1')
}
ReactDOM.render(<Main />, document.querySelector('#root'))
