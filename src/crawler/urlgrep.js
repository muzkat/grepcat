let fetch = require('node-fetch'),
    fs = require('fs'),
    cheerio = require('cheerio'),
    log = console.log,
    {screenshot} = require('../utils/screenshot.js'),
    {dateToString} = require("../utils/date");

const getHtml = function (url) {
    // TODO remove outer promise
    return new Promise(async (fulfill, reject) => {
        try {
            const data = await fetch(url).then((r) => r.text());
            fulfill(data);
        } catch (e) {
            reject();
        }
    })
}

const getCheerioObject = function (html){
   return cheerio.load(html)
}

const extractLinks = function (html, url) {
    let $ = getCheerioObject(html),
        links = [];
    $('a').each(function (i, elem) {
        let text = $(elem).text() || '';
        let href = $(elem).attr('href') || '';
        links.push({
            text: ((text.endsWith('..>') ? href : text) || '').trim(),
            href: href,
            base: url
        })
    })
    return links.filter((i) => i.text !== '../' && i.href !== '../');
}

const extract = function (html, extractDefinition = 'a') {
    let $ = getCheerioObject(html),
        extraction = [];
    $(extractDefinition).each(function (i, elem) {
        let text = $(elem).text() || '';
        extraction.push({
            eID: extractDefinition,
            part: text,
            partSlim: (text || '').trim()
        })
    })
    return extraction;
}

const isFile = function (item, validEndings = defaults.filterEndings) {
    validEndings = validEndings.map(i => '.' + i);
    let validEnding = false;
    validEndings.map(ending => {
        if (item.href.endsWith(ending)) validEnding = true;
        if (validEnding === false && item.href.toLowerCase().endsWith(ending)) validEnding = true;
    })
    return item.href && validEnding === true;
}

const isFolder = function (item) {
    return item.href && item.href.endsWith('/') && !item.href.startsWith('..');
}

const contextify = async function (arrayOfLinks, dir = false, config = {
    fileEndings: ['bin', 'exe', 'zip', 'tar.gz'],
    checkSums: ['md5']
}) {
    return new Promise((resolve) => {
        let links;
        if (dir) {
            links = arrayOfLinks.map(item => {
                item.isFolder = isFolder(item);
                item.isFile = isFile(item);
                if (item.isFolder || item.isFile) {
                    item[(item.isFolder ? 'folder' : 'file') + 'Path'] = item.base + item.href;
                }
                return item;
            })
        } else {
            links = arrayOfLinks.map(item => {
                item.isInstaller = isFile(item, config.fileEndings);
                item.isChecksum = isFile(item, config.checkSums);
                if (item.isInstaller || item.isChecksum) item.dlPath = item.href.startsWith('http') ? item.href : item.base + item.href;
                return item;
            })
        }
        resolve(links);
    })

}

let report = {
    version: 0.1
}

const fetchDir = async function (url) {
    return await getHtml(url).then(function (body) {
        return body;
    }).then(async (body) => {
        let items = extractLinks(body, url);
        return await contextify(items, true);
    })
};

const createReport = function (url, data, params = {}) {
    return Object.assign(report, Object.assign({
        data: data,
        url: url
    }, params))
}

const getFileName = function (reportObject) {
    var fileName = reportObject.name;
    fileName += '-' + dateToString(reportObject.now);
    fileName += '.' + defaults.report.format;
    return fileName;
}

const writeToDisk = function (reportObject, json) {
    fs.writeFileSync(getFileName(reportObject), JSON.stringify(json));
}

const recipe2Report = function (recipe) {
    recipe = recipe || {};
    return {
        url: recipe.targetUrl,
        name: recipe.reportName,
        now: new Date()
    };
};


const defaults = {
    screenshotPath: 'screenshots',
    screenshotFormat: 'png',
    screenshot: {
        path: 'screenshots',
        format: 'png'
    },
    report: {
        format: 'json'
    },
    installerFileEndings: ['bin', 'exe', 'zip', 'tar.gz'],
    checkSums: ['md5'],
    filterEndings: ['exe', 'bin', 'jar', 'war', 'zip', 'tar.gz', 'md5']
};

const contextifyBody = function (body, url, config = {
    fileEndings: defaults.installerFileEndings,
    checkSums: defaults.checkSums
}) {
    return contextify(extractLinks(body, url), true, config)
}

module.exports = {
    getCheerioObject,
    writeJsonToFile: writeToDisk,
    crawl: (recipe = {}) => {
        if (recipe.type && recipe.type in this) {
            return this[recipe.type](recipe);
        }
    },
    getHtml,
    extract,
    www: (url, internalOnly = true) => {
        return getHtml(url)
            .then((body) => {
                return extractLinks(body, url).map((l) => {
                    l.text = l.text || '';
                    l.text = l.text.trim();
                    return l;
                }).filter((l) => {
                    return internalOnly ? l.href.startsWith(l.base) : l;
                }).filter((l) => {
                    return internalOnly ? !l.href.includes('#') : l;
                });
            })
    },
    getLinks: (url) => {
        return getHtml(url).then((body) => {
            return body;
        })
    },
    grep: async (recipe) => {
        let reportObject = recipe2Report(recipe);
        return getHtml(reportObject.url)
            .then((body) => {
                return contextifyBody(body, reportObject.url);
            }).then((links) => {
                return createReport(reportObject.url, links, {
                    notes: ['links extracted'],
                    name: reportObject.name,
                    time: reportObject.now
                });
            }).then((report) => {
                writeToDisk(reportObject, report);
                return {
                    reportObject: reportObject,
                    report: report,
                    reportFileName: getFileName(reportObject)
                };
            })
    },
    getFileName,
    screenshot,
    grepDir: async (recipe) => {
        let reportObject = recipe2Report(recipe);
        return getHtml(reportObject.url).then((body) => {
            return contextifyBody(body, reportObject.url);
        }).then((links) => {
            return links.map(async (linkItem) => {
                try {
                    if (linkItem.isFolder) {
                        var folders = await fetchDir(linkItem.folderPath);
                        if (folders) linkItem.sub = folders;
                    }
                } catch (e) {
                    log('ERROR: ' + JSON.stringify(linkItem));
                    log(e);
                }
                return linkItem
            })
        }).then((report) => {
            return Promise.all(report);
        }).then((report) => {
            writeToDisk(reportObject, report);
            return {
                reportObject: reportObject,
                reportFileName: getFileName(reportObject),
                report: report
            };
        })
    }
}