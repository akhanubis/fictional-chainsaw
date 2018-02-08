require('dotenv').config({silent: true})
const Pusher = require('pusher')
let pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || process.env.REACT_APP_PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY || process.env.REACT_APP_PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET || process.env.REACT_APP_PUSHER_APP_SECRET,
  encrypted: true
})

let default_args = {
  channel: 'main',
  event: 'server_message',
  type: 'info'
}

let { channel, event, type, _ } = { ...default_args, ...require('minimist')(process.argv.slice(2)) }
pusher.trigger(channel, event, { type, message: _[0] })