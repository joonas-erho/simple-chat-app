const net = require('net')
const port = 9999

const clients = []
const messages = []

const server = net.createServer(onClientConnection)

server.listen(port, () => {
  console.log(`Server started. Running on port ${port}.`)
})

function onClientConnection(socket) {
  console.log(`${getSocketAddr(socket)} connected`)

  socket.on('data', (data) => {
    const message = data.toString().trim()
    let username = ''
    if (message.startsWith('/join')) {
      username = message.substring(6)
      socket.username = username
      clients.push(socket)

      console.log(`${username} connected`)
      messages.push({ content: `[${getCurrentTime()}] ${username} connected` })
    } 
    else if (message.startsWith('/whisper')) {
      let parts = message.split(' ')
      if (parts.length < 3) {
        messages.push({ content: 'Incorrect format for whisper command. Usage: /whisper <name> <message>', to: socket.username })
      }
      else {
        if (clients.findIndex(s => s.username === parts[1]) != -1) {
          messages.push({ content: `[${getCurrentTime()}] Whisper from ${socket.username}: ${parts.slice(2).join(" ")}`, to: parts[1] })
        }
        else {
          messages.push({ content: 'User with that name not found.', to: socket.username })
        }
      }
    }
    else {
      username = findUsername(socket, clients)
      messages.push({ content:`[${getCurrentTime()}] ${username}: ${message}` })
    }

    broadcast(username, true)
  })

  socket.on('close', () => {
    clients.splice(clients.findIndex(s => getSocketAddr(socket) === getSocketAddr(s)), 1)
    console.log(`${socket.username} disconnected`)
    messages.push({ content:`[${getCurrentTime()}] ${socket.username} disconnected`})
    broadcast(socket.username, false)
  })

  socket.on('error',function(error){
    console.error(`${socket.remoteAddress}:${socket.remotePort} Connection Error ${error}`)
  })
}

function broadcast(sender, toSelf) {
  for (const c of clients) {
    const message = getAllMessages(c.username)
    if (toSelf) {
      c.write(message)
      continue
    } else {
      if (c.username !== sender) {
        c.write(message)
      }
    } 
  }
}

function getSocketAddr(socket) {
  return `${socket.remoteAddress}:${socket.remotePort}`
}

function getCurrentTime() {
  const today = new Date()
  const hours = String(today.getHours()).padStart(2, '0')
  const minutes = String(today.getMinutes()).padStart(2, '0')
  const seconds = String(today.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function findUsername(socket, clients) {
  for (let i = 0; i < clients.length; i++) {
    if (getSocketAddr(clients[i]) === getSocketAddr(socket)) return clients[i].username
  }
  return 'ERRORNOTFOUND'
}

function getAllMessages(username) {
  let str = ''
  for (const msg of messages) {
    if (msg.to === undefined || (msg.to === username))
      str += msg.content + '\n'
  }
  return str.slice(0, -1)
}