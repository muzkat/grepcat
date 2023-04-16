const dateToString = function (now = new Date()) {
    return [now.getFullYear(), (now.getMonth() + 1), now.getDate()].join('-');
}

module.exports = {dateToString};