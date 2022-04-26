const urlgrep = require('./src/crawler/urlgrep'),
    pusher = require('./src/pusher/pusher'),
    wordgrep = require('./src/crawler/wordgrep'),
    probe = require('./src/crawler/probe')

module.exports = {
    crawler: urlgrep,
    pusher, wordgrep, probe
}