const fs = require('fs')
const logFile = process.env.HOME + '/.vx-google-cloud-speech.log'
const record = require('node-record-lpcm16')
const speech = require('@google-cloud/speech').v1p1beta1
require('protobufjs/src/util/minimal').isNode = true

module.exports = function googleCloudSpeech(speechProviderOptions) {
  if (!speechProviderOptions.serviceAccount) {
    throw new Error(
      'For Google Cloud Speech-To-Text to work, "speechProviderOptions.serviceAccount" is required in config.'
    )
  }
  process.env.GOOGLE_APPLICATION_CREDENTIALS =
    speechProviderOptions.serviceAccount
  return {
    startListening(opts, dispatch) {
      const client = new speech.SpeechClient()
      const th = opts.language === 'th'
      console.log('[speech] Invoked')
      const request = {
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: th ? 'th' : 'en-US',
          model: th ? 'default' : 'video',
          useEnhanced: true,
          enableAutomaticPunctuation: true,
          alternativeLanguageCodes: th ? ['en-US'] : []
        },
        interimResults: true
      }
      let stopTimeout
      let stopped = false
      let expireTime

      // Create a recognize stream
      const recognizeStream = client
        .streamingRecognize(request)
        .on('error', () => {
          dispatch({ type: 'error' })
        })
        .on('data', data => {
          if (data.results[0]) {
            const result = data.results[0]
            if (result) {
              dispatch({ type: 'result', result })
            }
          }
        })

      // Start recording and send the microphone input to the Speech API
      let totalSize = 0
      record
        .start({
          sampleRateHertz: 16000,
          threshold: 0,
          verbose: false,
          recordProgram: 'rec',
          silence: '10.0'
        })
        .on('data', buf => {
          totalSize += buf.length
          if (!expireTime) {
            console.log('[speech] Ready to listen')
            expireTime = Date.now() + 59000
            dispatch({ type: 'ready', expiryTime: expireTime })
            stopTimeout = setTimeout(() => {
              if (!stopped) {
                record.stop()
                console.log('[speech] Stop (timeout)')
                stopped = true
              }
            }, expireTime - Date.now())
          }
        })
        .on('error', console.error)
        .pipe(
          recognizeStream,
          { end: true }
        )
        .on('end', () => {
          const time = totalSize / 16000 / 2
          console.log(
            '[speech] API end, total size',
            totalSize,
            time.toFixed(2) + 's'
          )
          fs.appendFileSync(
            logFile,
            [new Date().toJSON(), Math.ceil(time), th ? 1 : 2].join('\t') + '\n'
          )
          dispatch({ type: 'end' })
        })
      return {
        stop() {
          clearTimeout(stopTimeout)
          if (!stopped) {
            record.stop()
            console.log('[speech] Stop (user)')
            stopped = true
          }
        }
      }
    }
  }
}
