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

const browser = async function () {
    const browser = await puppeteer.launch();
    return {
        browser,
        createPage: async function (width = 1920, height = 1080) {
            const page = await this.browser.newPage();
            await page.setViewport({
                width, height
            });
            return page;
        },
        takeScreenshot: async function (url, fileName, width = 1920, height = 1080) {
            const page = await this.createPage(width, height);
            await page.goto(url);
            if (screenshot) {
                const path = [defaults.screenshot.path, fileName].join('/');
                await page.screenshot({path});
            }
        },
        quit: async function () {
            return await this.browser.close();
        }
    }
}

const screenshot = async function (url, fileName = 'grepcat_screenshot', width = 1920, height = 1080) {
    let _browser = await browser();
    fileName = [dateToString(), new Date().getTime(), fileName].join('_');
    fileName = [fileName, defaults.screenshot.format].join('.');
    await _browser.takeScreenshot(url, fileName);
    await _browser.quit();
    return {
        fileName: fileName
    };
}

module.exports = {
    screenshot, browser
}