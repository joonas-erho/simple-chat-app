
const net = require('net')
const readline = require('readline')
const port = 9999

// Create TCP client
const client = new net.Socket()

// Variables of user
let username = ''
let joined = false

// Create readline interface for input of text.
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Clear out console.
process.stdout.write('\u001b[3J\u001b[1J');
logOn()

// This constantly listens for user input.
// Whenever it's given, re-render the console window.
rl.on('line', (line) => {
  if (line.startsWith('/')) {
    if (line.startsWith('/exit')) {
      client.end()
    }
    else if (line.startsWith('/whisper')) {
      client.write(line.toString().trim())
    }
    else {
      console.log('Command not found.')
    }
  } else {
    client.write(line.toString().trim())
  }
})

function attemptConnect() {
  client.connect(port, () => {
    console.log(`Connected to server on port ${port}.`)
    client.write(`/join ${username}`)
    joined = true
  })
  
  client.on('data', function(data) {
    process.stdout.write('\u001b[3J\u001b[1J');
    console.log(data.toString())
  })
  
  client.on('close', function() {
    console.log('Client: Connection Closed')
    process.exit(0)
  })

  // This could be developed further to properly handle errors.
  // Right now, generally the only error we get is if the server
  // closes so the current implementation reflects that.
  client.on('error', function() {
    console.log('Server: Connection Closed')
    process.exit(1)
  })
}

// Ask user for username at start. (This is only done once.)
function logOn() {
  rl.question('Please enter your username: ', (name) => {
    username = name.trim()
    attemptConnect()
  })
}