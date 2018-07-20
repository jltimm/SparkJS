var fs = require('fs');
var path = require('path');

/**
 * Creates JSON files with tfidf representation from text files synchronously.
 * @param {string} path The path where the files are
 * @param {boolean} accessSubDirs Flag indicating if sub directories should be accessed
 */
exports.createJSONFilesSync = function createJSONFilesSync(path, accessSubDirs)
{
    //TODO: big refactor: create hashmap while walking
    var allFiles = walkSync(path, accessSubDirs);
    var files = filterFilesSync(allFiles);
    return files;
}

/**
 * Checks if the filename is a text file or not
 * @param {string} name The filename 
 */
function isTextFile(name)
{
    var extname = path.extname(name);
    if (extname == '.txt' || extname == '.doc' || extname == '.docx')
    {
        return true;
    }
}

/**
 * Filters out directories, hidden files, non-text files, etc.
 * @param {array} files The list of files
 */
function filterFilesSync(files)
{
    var filteredFiles = [];
    for (var i = 0; i < files.length; i++)
    {
        var basename = path.basename(files[i]);
        if (basename[0] == '.' || fs.lstatSync(files[i]).isDirectory() || !isTextFile(basename))
        {
            continue;
        } else
        {
            filteredFiles.push(files[i]);
        }
    }
    return filteredFiles;
}

/**
 * Walks through files in a directory synchronoushly
 * @param {string} path The path where the files are
 * @param {boolean} accessSubDirs Flag indicating if sub directories should be accessed
 */
function walkSync(path, accessSubDirs)
{
    //TODO: check cwd
    var files = [];
    if (fs.existsSync(path) && fs.lstatSync(path).isDirectory())
    {
        files = fs.readdirSync(path);
        if (accessSubDirs)
        {
            var subFiles = []
            for (var i = 0; i < files.length; i++)
            {
                var filePath = path + '/' + files[i];
                if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory())
                {
                    subFiles = walkSync(filePath, true);
                }
                files[i] = filePath;
            }
            files = files.concat(subFiles);
        }
    }
    return files;
}