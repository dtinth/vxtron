import { ListeningOptions } from './voiceListener'

export interface AppCommands {
  requestListening(options: ListeningOptions): void
  recallPrevious(): void
  recallNext(): void
}
