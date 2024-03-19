const net = require('net')
const port = 9999

// Connected clients (sockets)
const clients = []

// All messages, including whispers and (dis)connection messages
const messages = []

// Create a server with onClientConnection as the function to
// be called when a socket attempts to connect.
const server = net.createServer(onClientConnection)

// Listen for connections.
server.listen(port, () => {
  console.log(`Server started. Running on port ${port}.`)
})

// This is called whenever a socket (client) attempts to
// connect. The listeners inside of this function will listen
// to that particular socket until it disconnects.
function onClientConnection(socket) {
  console.log(`${getSocketAddr(socket)} connected`)

  // Whenever any data is gotten from the client. This includes
  // the intial connection, as data is also sent then.
  socket.on('data', (data) => {
    // Parse message.
    const message = data.toString().trim()

    // Handle joining here.
    if (message.startsWith('/join')) {
      let username = ''
      username = message.substring(6)
      
      // Add username to socket object and push it to array
      socket.username = username
      clients.push(socket)

      console.log(`${username} connected`)
      messages.push({ content: `[${getCurrentTime()}] ${username} connected` })
    }
    else if (message.startsWith('/whisper')) {
      // Split the message
      let parts = message.split(' ')

      // Incorrect usage
      if (parts.length < 3) {
        messages.push({ content: 'Incorrect format for whisper command. Usage: /whisper <name> <message>', to: socket.username })
      }
      else {
        // Correct usage
        if (clients.findIndex(s => s.username === parts[1]) != -1) {
          messages.push({ content: `[${getCurrentTime()}] Whisper from ${socket.username}: ${parts.slice(2).join(" ")}`, to: parts[1] })
        }
        else {
          // User wasn't found
          messages.push({ content: 'User with that name not found.', to: socket.username })
        }
      }
    }
    else {
      // If no special commands were found, just push message.
      messages.push({ content:`[${getCurrentTime()}] ${socket.username}: ${message}` })
    }

    // Broadcast to all users.
    broadcast(socket.username, true)
  })

  // When the connection is closed, remove socket from the array and broadcast
  // disconnection to all.
  socket.on('close', () => {
    clients.splice(clients.findIndex(s => getSocketAddr(socket) === getSocketAddr(s)), 1)
    console.log(`${socket.username} disconnected`)
    messages.push({ content:`[${getCurrentTime()}] ${socket.username} disconnected`})
    broadcast(socket.username, false)
  })

  // On connection error, log it to console. This seems to rarely happen.
  socket.on('error',function(error){
    console.error(`${socket.remoteAddress}:${socket.remotePort} Connection Error ${error}`)
  })
}

/**
 * Broadcasts the message to clients
 * @param {string} sender - Username of sender
 * @param {boolean} toSelf - Whether or not the message should also be sent
 * to the sender themselves
 */
function broadcast(sender, toSelf) {
  // For each client, generate the total message they should see.
  for (const c of clients) {
    const message = getAllMessages(c.username)
    if (toSelf) {
      c.write(message)
      continue
    } else {
      // If we should not send the broadcast to also the socket that triggered
      // it, we only write to client that isn't sender.
      if (c.username !== sender) {
        c.write(message)
      }
    } 
  }
}

/**
 * Small helper function to get complete address of socket
 * @param {net.Socket} socket 
 */
function getSocketAddr(socket) {
  return `${socket.remoteAddress}:${socket.remotePort}`
}

/**
 * Returns current time only (no date) as HH:MM:SS.
 * @returns Current Time as HH:MM:SS, padding numbers with 0 if needed.
 */
function getCurrentTime() {
  const today = new Date()
  const hours = String(today.getHours()).padStart(2, '0')
  const minutes = String(today.getMinutes()).padStart(2, '0')
  const seconds = String(today.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/**
 * Concatenates all messages to a single string. If any messages are found
 * that have their "to"-attribute set to the given user, that message
 * is also added.
 * @param {string} username - User in question
 * @returns Single string with all messages, separated with newlines.
 */
function getAllMessages(username) {
  let str = ''
  for (const msg of messages) {
    if (msg.to === undefined || (msg.to === username))
      str += msg.content + '\n'
  }
  return str.slice(0, -1)
}