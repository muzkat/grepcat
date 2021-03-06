let request = require('request'),
    fs = require('fs'),
    cheerio = require('cheerio'),
    log = console.log;

const getHtml = async function (url) {
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

const isFile = function (item, validEndings) {
    validEndings = validEndings || ['exe', 'bin', 'jar', 'war', 'zip', 'tar.gz'];
    validEndings = validEndings.map(i => '.' + i);
    let validEnding = false;
    validEndings.map(ending => {
        if (item.href.endsWith(ending)) validEnding = true;
    })
    return item.href && validEnding === true;
}

const isFolder = function (item) {
    return item.href && item.href.endsWith('/') && !item.href.startsWith('..');
}

const contextify = async function (arrayOfLinks, dir) {
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
                item.isInstaller = isFile(item, ['bin', 'exe']);
                if (item.isInstaller) item.dlPath = item.href.startsWith('http') ? item.href : item.base + item.href;
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

const writeToDisk = function (reportObject, json) {
    var fileName = reportObject.name;
    fileName += '-' + reportObject.now.getFullYear() + '-' + (reportObject.now.getMonth() + 1) + '-' + reportObject.now.getDate();
    fileName += '.json'
    fs.writeFileSync(fileName, JSON.stringify(json));
}

const recipe2Report = function (recipe) {
    recipe = recipe || {};
    return {
        url: recipe.targetUrl,
        name: recipe.reportName,
        now: new Date()
    };
};

module.exports = {
    grep: (recipe) => {
        let reportObject = recipe2Report(recipe);
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
            writeToDisk(reportObject, report);
        })
    },
    grepDir: async (recipe) => {
        let reportObject = recipe2Report(recipe);
        getHtml(reportObject.url).then(async function (body) {
            return body;
        }).then((body) => {
            let items = extractLinks(body, reportObject.url);
            return contextify(items, true);
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
        })
    }
}