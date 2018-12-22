import { actionHandler, actionType, actionTypes } from './reducer-utils'

export const actions = actionTypes({
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

export type State = {
  /** The speech recognition status */
  status: 'idle' | 'listeningRequested' | 'listening'

  /** The time at which the current speech recognition session will expire. */
  listeningExpiryTime?: number

  /**
   * The current interim result.
   * Will revert to an empty string after the current transcription is finalized.
   */
  currentTranscript: string

  /**
   * A list of past transcriptions, sorted ascending by time.
   */
  history: {
    transcript: string
    timestamp: number
  }[]

  /**
   * The index of history item that is currently displayed.
   * Will be set to `state.history.length` when not displaying anything.
   */
  historyIndex: number
}

export const initialState: State = {
  status: 'idle',
  currentTranscript: '',
  historyIndex: 0,
  history: []
}

export const reducer = actionHandler<State>()
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