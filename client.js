
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
  // Do some basic command checking here.
  if (line.startsWith('/')) {
    if (line.startsWith('/exit')) {
      client.end()
    }
    else if (line.startsWith('/whisper')) {
      client.write(line.toString().trim())
    }
    else if (line.startsWith('/join')) {
      console.log('Already joined.')
    }
    else {
      console.log('Command not found.')
    }
  } else {
    client.write(line.toString().trim())
  }
})

// This is called when a username is given.
function attemptConnect() {
  // On connection, we use the join command. It can't be
  // used again if we have already joined.
  client.connect(port, () => {
    console.log(`Connected to server on port ${port}.`)
    client.write(`/join ${username}`)
    joined = true
  })
  
  // This is called whenever we get data from the server.
  // We clear the screen and retype the data.
  client.on('data', function(data) {
    process.stdout.write('\u001b[3J\u001b[1J');
    console.log(data.toString())
  })
  
  // Called when the connection is closed, specifically when
  // closed by the client.
  client.on('close', function() {
    console.log('Client: Connection Closed')
    process.exit(0)
  })

  // This could be developed further to properly handle errors.
  // Right now, generally the only error we get is if the server
  // closes so the current implementation reflects that.
  client.on('error', function() {
    console.log('Server: Connection Closed')

    // Error code for unexpected server connection closure.
    process.exit(500)
  })
}

// Ask user for username at start. (This is only done once.)
function logOn() {
  rl.question('Please enter your username: ', (name) => {
    username = name.trim()
    attemptConnect()
  })
}