let fetch = require('node-fetch'), log = console.log

const fetchData = function (url) {
    return new Promise(async (fulfill, reject) => {
        try {
            const response = await fetch(url);
            let data = await response.json();
            fulfill(data);
        } catch (e) {
            reject();
        }
    })
}

const dateStrToIso = function (dateStr) {
    return new Date(dateStr).toISOString();
}

const getBasePath = function (url) {
    return url + '/wp-json/wp/v2/';
}

const getPosts = function (url, items = 100, page) {
    const basePath = this.getBasePath(url);
    const postUrl = basePath + 'posts?per_page=' + items
    return fetchData(postUrl).then((data = []) => {
        return data.map((p) => {
            let {
                id, date, modified, slug, title, status, type, link, excerpt, tags, author
            } = p;

            let lang = 'de'
            if (link.includes('/en/')) {
                lang = 'en';
            }
            date = dateStrToIso(date)
            modified = dateStrToIso(modified)

            title = (title || {}).rendered || '-1';
            excerpt = (excerpt || {}).rendered || '-1';

            return {
                lang, id, date, title, modified, slug, status, type, link, excerpt, tags, author
            }
        });
    })
}

module.exports = {
    getBasePath,
    getPosts
}