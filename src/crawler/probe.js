/**
 *
 * @param url
 * @param options
 * @returns {Promise<{headers: {}, status}>}
 *
 * example response
 *  *
 * {
 *   status: 200,
 *   headers: {
 *     'accept-ranges': 'bytes',
 *     connection: 'close',
 *     'content-length': '2373149',
 *     'content-type': 'application/octet-stream',
 *      server: 'nginx'
 *   }
 * }
 *
 */

const probeUrl = async function (url, options) {
    const result = await fetch(url, options);
    const {status, headers} = result;
    let obj = {};
    if (headers) {
        headers.forEach((value, name) => {
            obj[name] = value;
        })
    }
    return {
        status,
        headers: obj
    }
}

// inspired from https://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
const format = function (s, params) {
    const args = Array.from(arguments).slice(1);
    return s.replace(/{(\d+)}/g, function (match, index) {
        return typeof args[index] == 'undefined' ? match : args[index];
    });
};

module.exports = {
    probeUrl,
    format
}
