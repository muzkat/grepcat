const puppeteer = require("puppeteer");
const {dateToString} = require("./date.js");

// todo install / import puppeteer on demand

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
const screenshot = async function (url, fileName, width = 1920, height = 1080) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({
        width, height
    });
    await page.goto(url);
    fileName = dateToString() + '-' + fileName + '.' + defaults.screenshot.format;
    await page.screenshot({path: defaults.screenshot.path + '/' + fileName});

    await browser.close();
    return {
        fileName: fileName
    };
}

module.exports = {
    screenshot
}