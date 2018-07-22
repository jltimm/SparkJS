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
        getWordMaps(files, function(err, data)
        {
            //TODO
        });
    });
}

/**
 * Gets the word maps for each file
 * @param {array} filenames The filenames
 * @param {function} callback The callback
 */
function getWordMaps(filenames, callback)
{
    var globalDict = {};
    var pending = filenames.length;
    filenames.forEach(function(filename)
    {
        fs.readFile(filename, 'utf8', function(err, data)
        {
            var fileDict = {};
            data = data.replace(/[^\w\s]/gi, '');
            var words = data.split(' ');
            words.forEach(function(word)
            {
                if (!word)
                {
                    return;
                }
                word = word.toLowerCase();
                if (globalDict[word])
                {
                    globalDict[word] = globalDict[word] + 1;
                } else
                {
                    globalDict[word] = 1;
                }
                if (fileDict[word])
                {
                    fileDict[word] = fileDict[word] + 1;
                } else
                {
                    fileDict[word] = 1;
                }
            });
            if (!--pending)
            {
                callback(null, globalDict);
            }
        });
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
 * Walks through files in a directory asynchronously.
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
                if (err) throw err;
                if (stat && stat.isDirectory())
                {
                    walk(file, function(err, res)
                    {
                        results = results.concat(res);
                        if (!--pending) callback(null, results);
                    });
                } else
                {
                    var basename = path.basename(file);
                    if (isTextFile(basename))
                    {
                        results.push(file);
                    }
                    if (!--pending) callback(null, results);
                }
            });
        });
    });
};