const urlgrep = require('./src/crawler/urlgrep'),
    pusher = require('./src/pusher/pusher'),
    wordgrep = require('./src/crawler/wordgrep')

module.exports = {
    crawler: urlgrep,
    pusher: pusher,
    wordgrep: wordgrep
}