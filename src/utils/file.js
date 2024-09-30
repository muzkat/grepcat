const {readdir, readFile} = require('fs').promises,
    mimeLib = require("mime-types"),
    fs = require('fs'),
    log = console.log;

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

const deleteFile = function (pathToFile) {
    fs.rmSync(pathToFile, {
        force: true,
    });
}

module.exports = {readDir, readFileFn, deleteFile}