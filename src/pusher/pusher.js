const {readdir, readFile} = require('fs').promises,
    fetch = require('node-fetch')

let api = {
    readDir: async function (path) {
        try {
            return await readdir(path);
        } catch (err) {
            console.error(err);
        }
    },
    readFile: async function (path, encoding = 'utf8') {
        try {
            return await readFile(path, {encoding: encoding});
        } catch (err) {
            console.error(err);
        }
    },
    addToCloud: async function (index = 'test-data', data = {}, id = undefined, type, requestOptions = {}) {
        let {params} = requestOptions,
            p = new URLSearchParams();

        Object.keys(params).map((k) => {
            p.append(k, params[k]);
        })

        let error = false,
            res = undefined;
        try {
            res = await fetch(requestOptions.url + '?' + p.toString(), {
                method: requestOptions.method || "post",
                body: JSON.stringify(data),
                headers: requestOptions.headers,
            });
        } catch (e) {
            error = true;
            console.log(res);
        }

        return error ? null : (res ? await res.json() : null);
    }
}

module.exports = api;