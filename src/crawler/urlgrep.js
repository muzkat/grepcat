let fetch = require('node-fetch'),
    fs = require('fs'),
    cheerio = require('cheerio'),
    log = console.log,
    puppeteer = require('puppeteer');

const getHtml = function (url) {
    return new Promise(async (fulfill, reject) => {
        try {
            const response = await fetch(url);
            let data = await response.text();
            fulfill(data);
        } catch (e) {
            reject();
        }
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

const isFile = function (item, validEndings = ['exe', 'bin', 'jar', 'war', 'zip', 'tar.gz']) {
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

const dateToString = function (now = new Date()) {
    return now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
}

const getFileName = function (reportObject) {
    var fileName = reportObject.name;
    fileName += '-' + dateToString(reportObject.now);
    fileName += '.json'
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

const screenshot = async function (url, fileName) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({
        width: 1920,
        height: 1080
    });
    await page.goto(url);
    fileName = dateToString() + '-' + fileName + '.png';
    await page.screenshot({path: 'screenshots/' + fileName});

    await browser.close();
    return {
        fileName: fileName
    };
}

module.exports = {
    writeJsonToFile: writeToDisk,
    www: (url, internalOnly = true) => {
        return getHtml(url).then(function (body) {
            return body;
        }).then((body) => {
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
        return getHtml(reportObject.url).then((body) => {
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
            return {
                reportObject: reportObject,
                report: report,
                reportFileName: getFileName(reportObject)
            };
        })
    },
    getFileName: getFileName,
    screenshot: screenshot,
    grepDir: async (recipe) => {
        let reportObject = recipe2Report(recipe);
        return getHtml(reportObject.url).then(async (body) => {
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
            return {
                reportObject: reportObject,
                reportFileName: getFileName(reportObject),
                report: report
            };
        })
    }
}