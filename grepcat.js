const urlgrep = require('./src/crawler/urlgrep'),
    pusher = require('./src/pusher/pusher')

module.exports = {
    crawler: urlgrep,
    pusher: pusher
}