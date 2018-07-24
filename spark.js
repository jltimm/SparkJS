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
        getWordMaps(files, function(err, globalMap, fileMaps)
        {
            if (err) throw err;
            tfidf(globalMap, fileMaps, function(err, data)
            {
                if (err) throw err;
                // TODO: handle data
            })
        });
    });
}

/**
 * Creates TFIDF JSON files from word mapss.
 * @param {dictionary} globalMap The global word map
 * @param {array} fileMaps The list of file mapss
 * @param {function} callback The callback
 */
function tfidf(globalMap, fileMaps, callback)
{
    //TODO: finish this method
}

/**
 * Gets the word maps for each file
 * @param {array} filenames The filenames
 * @param {function} callback The callback
 */
function getWordMaps(filenames, callback)
{
    var globalMap = {};
    var fileMaps = [];
    var pending = filenames.length;
    filenames.forEach(function(filename)
    {
        fs.readFile(filename, 'utf8', function(err, data)
        {
            if (err) throw err;
            var fileMap = {};
            // Remove all non alphanumeric characters, split on space.
            data = data.replace(/[^\w\s]/gi, '');
            var words = data.split(' ');

            words.forEach(function(word)
            {
                if (!word)
                {
                    return;
                }
                word = word.toLowerCase();
                if (globalMap[word])
                {
                    globalMap[word] = globalMap[word] + 1;
                } else
                {
                    globalMap[word] = 1;
                }
                if (fileMap[word])
                {
                    fileMap[word] = fileMap[word] + 1;
                } else
                {
                    fileMap[word] = 1;
                }
            });
            fileMaps.push({filename: filename, fileMap: fileMap});
            if (!--pending)
            {
                callback(null, globalMap, fileMaps);
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
    // TODO: find out way to add more than just text files... maybe an array of accepted file types?
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
    fs.readdir(dir, function(err, files)
    {
        if (err) return callback(err);
        var pending = files.length;
        if (!pending) return callback(null, results);
        files.forEach(function(file)
        {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat)
            {
                if (err) throw err;
                if (stat && stat.isDirectory())
                {
                    walk(file, function(err, res)
                    {
                        if (err) throw err;
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