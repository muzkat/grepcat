const mimeLib = require("mime-types"),
    log = console.log;
const {readDir, readFileFn, deleteFile} = require("../utils/file");

const fetchFiles = function (path, start, ending) {
    return readDir(path).then(async (files) => {
        return files.filter(name => (ending ? name.endsWith(ending) : true) && (start ? name.startsWith(start) : true));
    });
}

const getFileObject = async function (filename, path) {
    let filePath = path + filename;
    let base64 = await readFileFn(filePath, 'base64');
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
        log(res);
    }

    return error ? null : (res ? await res.json() : null);
}

const archiveFile = async function (fileObj, index, url, headers) {
    const type = '_doc', id = new Date().getTime();
    let res = await addToCloud(index, fileObj, id, type, {
        url: url,
        params: {index, id, type},
        headers: headers
    });
    let error = false;
    if (res === null) {
        log('error');
        error = true;
    } else {
        if (res && res.error) {
            log(res);
            error = true;
        }
    }
    return error;
}

const archivePath = async function (path = './', start, ending, index, url, headers) {
    await fetchFiles(path, start, ending).then(async (files) => {
        log('BEFORE: ' + files.length)
        for (let filename of files) {
            log('PROCESSING: ' + filename)
            let fileObj = await getFileObject(filename, path)
            log(fileObj.filename + ' ' + fileObj.mime);
            const uploadError = await archiveFile(fileObj, index, url, headers);
            if (uploadError === false) {
                deleteFile(path + filename);
            }
        }

        let filesAfter = await fetchFiles(path, start, ending) || [];
        log('AFTER: ' + filesAfter.length)
    })
}

module.exports = {
    readDir,
    readFile: readFileFn,
    fetchFiles,
    getFileObject,
    archivePath,
    archiveFile,
    deleteFile,
    addToCloud
};