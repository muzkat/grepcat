const fetchData = function (url) {
    return fetch(url)
        .then((r) => {
            let {status} = r;
            if (status === 200) {
                return r.json();
            } else {
                console.debug('error fetching posts via api: ' + url);
                console.debug('http status ' + status);
            }
        });
}
const dateStrToIso = function (dateStr) {
    return new Date(dateStr).toISOString();
}
const getBasePath = function (url) {
    return url + '/wp-json/wp/v2/';
}
const transformPost = function (p = {}) {
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
}
const getPosts = function (url, items = 100, page) {
    const postUrl = this.getBasePath(url) + 'posts?per_page=' + items
    return fetchData(postUrl)
        .then((data = []) => {
            return Array.isArray(data) ? data.map(transformPost) : [];
        })
}

module.exports = {
    getBasePath,
    getPosts
}