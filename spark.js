var fs = require('fs');

/**
 * Creates JSON files with tfidf representation from text files synchronously.
 * @param {string} path The path where the files are
 * @param {boolean} accessSubDirs Flag indicating if sub directories should be accessed
 */
module.exports = function createJSONFilesSync(path, accessSubDirs)
{
    var files = retrieveFiles(path);

}

function retrieveFiles(path, accessSubDirs)
{
    var files = [];
    if (fs.existsSync(path) && fs.lstatSync(path).isDirectory())
    {
        files = fs.readdirSync(path);
    }
}