let fetch = require('node-fetch'),
    log = console.log

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

module.exports = {
    getBasePath: function (url) {
        return url + /wp-json/;
    },
    getPosts: function (url) {
        const basePath = this.getBasePath(url);
        const postUrl = basePath + 'wp/v2/posts?per_page=100'
        return fetchData(postUrl).then((data = []) => {
            log('POSTS FOUND: ' + data.length);
            return data.map((p) => {
                let {
                    id,
                    date,
                    // date_gmt,
                    modified,
                    // modified_gmt,
                    slug,
                    title,
                    status,
                    type,
                    link,
                    excerpt,
                    tags,
                    author
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
                    lang,
                    id,
                    date,
                    // date_gmt,
                    title,
                    modified,
                    // modified_gmt,
                    slug,
                    status,
                    type,
                    link,
                    excerpt,
                    tags,
                    author
                }
            }).map((p) => {
                log(p.id + ' - ' + p.lang + ' - ' + p.title.rendered);
                return p;
            })
        })
    }
}