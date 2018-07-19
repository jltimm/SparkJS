var fs = require('fs');

/**
 * Creates JSON files with tfidf representation from text files synchronously.
 * @param {string} path The path where the files are
 * @param {boolean} shouldGetSubDirs Flag indicating if sub directories should be accessed
 */
module.exports = function createJSONFilesSync(path, shouldGetSubDirs)
{
    var files = [];
    if (fs.existsSync(path) && fs.lstatSync(path).isDirectory())
    {
        files = fs.readdirSync(path);
    }

}