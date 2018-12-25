const express = require('express')
const http = require('http')
const socketIO = require('socket.io')

const opn = require('opn')
module.exports = function startServer(providerOptions) {
  var app = express()
  var server = new http.Server(app)
  var io = socketIO(server)

  app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html')
  })

  let clients = 0
  let currentRecognition
  let serverUrl
  io.on('connection', function(socket) {
    clients++
    const name = `Speech recognizer id=${socket.id}`
    console.log(`[vxchromeserver] ${name} connected (clientCount=${clients})`)
    socket.on('disconnect', function() {
      clients--
      console.log(
        `[vxchromeserver] ${name} disconnected (clientCount=${clients})`
      )
    })
    socket.on('i am here', () => {
      if (currentRecognition) {
        currentRecognition.take(socket)
        currentRecognition = null
      }
    })
  })

  server.listen(+providerOptions.port || 8555, '127.0.0.1', function() {
    const serverAddress = server.address()
    // @ts-ignore
    const url = 'http://localhost:' + serverAddress.port
    serverUrl = url
    console.log(url)
  })

  return {
    hasActiveClients() {
      return clients > 0
    },
    startListening(opts, dispatch) {
      console.log('[vxchromeserver] startListening')
      if (clients === 0 && providerOptions.openBrowser !== false && serverUrl)
        opn(serverUrl)
      let currentSocket = null
      let stopped = false
      const cleanup = () => {
        currentSocket.removeListener('recognition event', onEvent)
        currentSocket.removeListener('disconnect', onDisconnect)
      }
      const onEvent = event => {
        console.log('[vxchromeserver]', dispatch)
        dispatch(event)
        if (event.type === 'end' || event.type === 'error') {
          console.log('[vxchromeserver] ended')
          cleanup()
        }
      }
      const onDisconnect = event => {
        dispatch({ type: 'end' })
        cleanup()
      }
      const recognition = {
        take(socket) {
          if (stopped) return
          currentSocket = socket
          socket.emit('start recognition', opts)
          socket.on('recognition event', onEvent)
          socket.on('disconnect', onDisconnect)
        }
      }
      currentRecognition = recognition
      io.emit('request recognition')
      return {
        stop() {
          if (stopped) return
          stopped = true
          if (currentSocket) {
            currentSocket.emit('stop recognition')
          }
        }
      }
    }
  }
}
