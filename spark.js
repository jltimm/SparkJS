var fs = require('fs');
var path = require('path');

/**
 * Creates JSON files with tfidf representation from text files asynchronously.
 * @param {stirng} path The path where the files are 
 * @param {function} callback The callback
 */
exports.createJSONFiles = function createJSONFiles(path, callback)
{
    walk(path, function(err, files)
    {
        if (err) throw err;
        files = filterFiles(files);
        callback(null, files);
    });
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
 * Filters out hidden files and non-text files.
 * @param {array} files The list of files. 
 */
function filterFiles(files)
{
    var filteredFiles = [];
    for (var i = 0; i < files.length; i++)
    {
        var basename = path.basename(files[i]);
        if (basename[0] == '.' || !isTextFile(basename))
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
 * Walks through files in a directory asynchronously. (From https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search)
 * @param {string} dir The directory where the files are 
 * @param {function} callback The callback
 */
function walk(dir, callback)
{
    var results = [];
    fs.readdir(dir, function(err, list)
    {
        if (err) return callback(err);
        var pending = list.length;
        if (!pending) return callback(null, results);
        list.forEach(function(file)
        {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat)
            {
                if (stat && stat.isDirectory())
                {
                    walk(file, function(err, res)
                    {
                        results = results.concat(res);
                        if (!--pending) callback(null, results);
                    });
                } else
                {
                    results.push(file);
                    if (!--pending) callback(null, results);
                }
            });
        });
    });
};