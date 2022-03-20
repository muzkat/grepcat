const {readdir, readFile} = require('fs').promises,
    fetch = require('node-fetch'),
    mimeLib = require("mime-types"),
    fs = require('fs');

const readDir = async function (path) {
    try {
        return await readdir(path);
    } catch (err) {
        console.error(err);
    }
}

const readFileFn = async function (path, encoding = 'utf8') {
    try {
        return await readFile(path, {encoding: encoding});
    } catch (err) {
        console.error(err);
    }
};

const fetchFiles = function (path, start, ending) {
    return readDir(path).then(async (files) => {
        return files.filter(name => (ending ? name.endsWith(ending) : true) && (start ? name.startsWith(start) : true));
    });
}

const getFileObject = async function (filename, path) {
    let filePath = path + filename;
    let base64 = await readFile(filePath, 'base64');
    let mime = mimeLib.lookup(filename);
    let bytes = base64.length;
    return {
        filename,
        base64,
        mime,
        bytes
    }
}

const addToCloud = async function (index = 'test-data', data = {}, id = undefined, type, requestOptions = {}) {
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

const archivePath = async function (path = './', start, ending, index, url, headers) {
    await fetchFiles(path, start, ending).then(async (files) => {
        console.log(files.length);
        console.log('BEFORE: ' + files.length)
        console.table(files);

        for (let filename of files) {
            console.log('PROCESSING')
            let fileObj = await getFileObject(filename, path)
            console.log(fileObj.filename + ' ' + fileObj.mime)
            const type = '_doc', id = new Date().getTime();
            let res = await addToCloud(index, fileObj, id, type, {
                url: url,
                params: {index, id, type},
                headers: headers
            });
            let error = false;
            if (res === null) {
                console.log('error');
                error = true;
            } else {
                if (res && res.error) {
                    console.log(res);
                    error = true;
                }
            }
            if (error === false) {
                console.log('DELETING')
                fs.rmSync(path + filename, {
                    force: true,
                });
            }
        }


        let filesAfter = await fetchFiles(path, start, ending) || [];
        console.log(filesAfter.length);
        console.log('AFTER: ' + filesAfter.length)
    })
}

module.exports = {
    readDir,
    readFile: readFileFn,
    fetchFiles,
    getFileObject,
    archivePath,
    addToCloud
};