var fs = require('fs');

/**
 * Creates JSON files with tfidf representation from text files synchronously.
 * @param {string} path The path where the files are
 * @param {boolean} accessSubDirs Flag indicating if sub directories should be accessed
 */
module.exports = function createJSONFilesSync(path, accessSubDirs)
{
    var files = retrieveFilesSync(path, accessSubDirs);
    console.log(files);
}

/**
 * Retrieves files in a directory syncrhonoushly
* @param {string} path The path where the files are
 * @param {boolean} accessSubDirs Flag indicating if sub directories should be accessed
 */
function retrieveFilesSync(path, accessSubDirs)
{
    var files = [];
    if (fs.existsSync(path) && fs.lstatSync(path).isDirectory())
    {
        files = fs.readdirSync(path);
        if (accessSubDirs)
        {
            var subFiles = []
            for (file in files)
            {
                filePath = path + '/' + files[file];
                if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory())
                {
                    subFiles = retrieveFiles(filePath);
                }
            }
            files = files.concat(subFiles);
        }
    }
    return files;
}