const fetchData = function (url) {
    return fetch(url)
        .then((r) => {
            let {status} = r;
            if (status === 200) {
                return r.json();
            } else {
                console.debug('error fetching posts via api: ' + url);
                console.debug('http status ' + status);
                return [];
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

const getAllPosts = async function (url, page = 1, data = []) {
    let fetchResult = await fetchData(createUrl(url, undefined, page));
    if (fetchResult.length === 100) {
        return getAllPosts(url, page + 1, data.concat(fetchResult));
    }
    return data.concat(fetchResult);
}

const createUrl = function (url = '', per_page = 100, page = 1) {
    return getBasePath(url) + ['posts', new URLSearchParams({per_page, page})].join('?');
}

const getPosts = function (url) {
    return getAllPosts(url).then((posts) => posts.map(transformPost));
}

module.exports = {
    getBasePath,
    getPosts
}