import { actionHandler, actionType, actionTypes } from './reducer-utils'

export const actions = actionTypes({
  /** When pressing the "Listen" button */
  ListeningRequested: actionType<{}>(),

  /** When speech recognition is ready to take voice input */
  ListeningStarted: actionType<{
    /**
     * The time that the speech recognition session will end.
     * May be `undefined` if there's no expiration.
     */
    expiryTime?: number
  }>(),

  /** When listening session is finished or expired */
  ListeningFinished: actionType<{
    /** The timestamp that this has occurred */
    timestamp: number
  }>(),

  /** When transcript is received */
  TranscriptReceived: actionType<{
    /** The transcribed text */
    transcript: string
    /** `true` if this is the final result. `false` if this is an interim result. */
    isFinal: boolean
    /** The timestamp that this transcript has been received */
    timestamp: number
  }>(),

  /** When it is time to hide the HUD */
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
   * The current interim transcript.
   * Will revert to an empty string after the current transcription is finalized.
   */
  currentTranscript: string

  /**
   * A list of past transcriptions, sorted ascending by time.
   */
  history: {
    /** The transcribed text */
    transcript: string
    /** The timestamp that this transcript has been received */
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
    if (state.currentTranscript) {
      state.history.push({
        timestamp: action.timestamp,
        transcript: state.currentTranscript
      })
      state.historyIndex = state.history.length - 1
      state.currentTranscript = ''
    }
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
      const text = String(action.transcript).trim()
      state.history.push({
        timestamp: action.timestamp,
        transcript: postprocess(text, state.history)
      })
      state.historyIndex = state.history.length - 1
      state.currentTranscript = ''
    } else {
      state.currentTranscript = action.transcript
    }
  })
  .toReducer()

function postprocess(text: string, history: State['history']) {
  text = text.replace(/(\S)เว้นวรรค(\S)/g, '$1 $2')
  if (text.match(/ capitalized$/)) {
    return text.replace(/ capitalized$/, '').replace(/^./, a => a.toUpperCase())
  }
  if (text === 'capitalize') {
    if (history.length > 0) {
      return history[history.length - 1].transcript.replace(/^./, a =>
        a.toUpperCase()
      )
    }
  }
  return text
}
