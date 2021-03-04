let request = require('request'),
    fs = require('fs'),
    cheerio = require('cheerio'),
    log = console.log;

function getHtml(url) {
    return new Promise((fulfill, reject) => {
        request.get({
            url: url
        }, function (err, httpResponse, body) {
            if (err) return reject()
            fulfill(body);
        })
    })
}

const extractLinks = function (html, url) {
    let $ = cheerio.load(html),
        links = [];
    $('a').each(function (i, elem) {
        links.push({
            text: $(elem).text(),
            href: $(elem).attr('href'),
            base: url
        })
    })
    return links;
}

const contextify = function (arrayOfLinks) {
    return arrayOfLinks.map(item => {
        item.isInstaller = item.href && (item.href.endsWith('.bin') || item.href.endsWith('.exe'))
        item.dlPath = item.href.startsWith('http') ? item.href : item.base + item.href;
        return item;
    })
}

let report = {
    version: 0.1
}

const createReport = function (url, data, params = {}) {
    return Object.assign(report, Object.assign({
        data: data,
        url: url
    }, params))
}


module.exports = {
    grep: function (recipe) {
        recipe = recipe || {};

        let reportObject = {
            url: recipe.targetUrl,
            name: recipe.reportName,
            now: new Date()
        };

        getHtml(reportObject.url).then(function (body) {
            return body;
        }).then((body) => {
            let arrayOfLinks = extractLinks(body, reportObject.url);
            return contextify(arrayOfLinks);
        }).then((links) => {
            return createReport(reportObject.url, links, {
                notes: ['links extracted'],
                name: reportObject.name,
                time: reportObject.now
            });
        }).then((report) => {
            var fileName = reportObject.name;
            fileName += '-' + reportObject.now.getFullYear() + '-' + (reportObject.now.getMonth() + 1) + '-' + reportObject.now.getDate();
            fileName += '.json'
            fs.writeFileSync(fileName, JSON.stringify(report));
        })
    }
}