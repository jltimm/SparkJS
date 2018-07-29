var fs = require('fs');
var path = require('path');

/**
 * The data directory
 */
global.dataDirectory = '';

/**
 * The name of the data file. Default is data.json
 */
global.dataFileName = 'data.json';

/**
 * Creates JSON files with tfidf representation from text files asynchronously.
 * @param {stirng} path The path where the files are 
 * @param {function} callback The callback
 */
exports.createJSONFiles = function createJSONFiles(filepath, callback)
{
    // TODO: add check to see if file or directory before calling walk.
    var dir = path.resolve(__dirname, filepath);
    walk(dir, (err, files) =>
    {
        if (err) throw err;
        getWordMaps(files, (err, globalMap, fileMaps) =>
        {
            if (err) throw err;
            var maps = tfidf(globalMap, fileMaps);
            //TODO: add param for destination path
            var dataDirectory = getDataDirectory();
            if (dataDirectory)
            {
                var output = path.resolve(dataDirectory, getDataFileName());
                fs.writeFile(output, JSON.stringify(maps), 'utf-8', (err) =>
                {
                    if (err) throw err;
                    console.log("File successfully created!")
                });
            }
        });
    });
}

/**
 * Gets the data file name
 * @returns The global data file name
 */
function getDataFileName()
{
    return global.dataFileName;
}

/**
 * Sets the data file name
 * @param {string} filename The filename
 */
exports.setDataFileName = function setDataFileName(filename)
{
    global.dataFileName = filename;
}

/**
 * Sets the data directory
 * @param {string} filepath Where the data directory lives
 */
exports.setDataDirectory = function setDataDirectory(filepath)
{
    fs.readdir(filepath, (err, files) =>
    {
        if (err) throw err;
        var i = 1;
        filename = getDataFileName();
        if (files.includes(filename))
        {
            throw Error("ERROR: " + filename + " already exists in " + filepath);
        }
        this.setDataFileName(filename);
    });
    global.dataDirectory = filepath;
}

/**
 * Retrieves the data directory.
 * @returns The data directory
 */
function getDataDirectory()
{
    return global.dataDirectory;
}

/**
 * Adds a file to the JSON file (requires full path)
 * @param {string} filepath The filepath
 * @param {function} callback The callback
 */
exports.addFile = function addFile(filepath, callback)
{
    var dir = path.resolve(__dirname, filepath);
    fs.stat(dir, (err, stat) => 
    {
        if (err) throw err;
        if (stat && stat.isDirectory())
        {
            walk(dir, (err, files) => 
            {
                if (err) throw err;
            })
        } else if (stat && stat.isFile() && isTextFile(filepath))
        {
            // TODO
        }
    })
}

/**
 * Creates TFIDF from word maps.
 * http://www.tfidf.com/
 * @param {dictionary} globalMap The global word map
 * @param {array} fileMaps The list of file mapss
 */
function tfidf(globalMap, fileMaps)
{
    var numFiles = fileMaps.length;
    fileMaps.forEach((file) =>
    {
        for (var key in file.fileMap)
        {
            var tf = file.fileMap[key] / file.numWords;
            var idf = numFiles / globalMap[key];
            var tfidf = tf * idf;
            file.tfidfMap[key] = tfidf;
        }
    });
    var maps = {global: globalMap, files: fileMaps};
    return maps;
}

/**
 * Gets the word maps for each file
 * @param {array} filenames The filenames
 * @param {function} callback The callback
 */
function getWordMaps(filenames, callback)
{
    // TODO: check if global map already exists
    var globalMap = {};
    var fileMaps = [];
    var pending = filenames.length;
    filenames.forEach((filename) =>
    {
        fs.readFile(filename, 'utf8', (err, data) =>
        {
            if (err) throw err;
            var fileMap = {};
            // Remove all non alphanumeric characters, split on space.
            data = data.replace(/[^\w\s]/gi, '');
            var words = data.split(' ');
            var numWords = 0;
            words.forEach((word) =>
            {
                if (!word)
                {
                    return;
                }
                word = word.toLowerCase();
                numWords++;
                if (fileMap[word])
                {
                    fileMap[word] = fileMap[word] + 1;
                } else
                {
                    fileMap[word] = 1;
                    if (globalMap[word])
                    {
                        globalMap[word] = globalMap[word] + 1;
                    } else
                    {
                        globalMap[word] = 1;
                    }
                }
            });
            fileMaps.push({filename: filename, fileMap: fileMap, numWords: numWords, tfidfMap: {}});
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
 * @param {array} extensions Addition extensions
 */
function isTextFile(name, extensions)
{
    var extname = path.extname(name);
    if (extname == '.txt' || extname == '.doc' || extname == '.docx')
    {
        return true;
    }
    if (extensions)
    {
        var shouldAdd = false;
        extensions.forEach((extension) =>
        {
            if (extname == extension)
            {
                shouldAdd = true;
                return true;
            }
        });
        return shouldAdd;
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
    fs.readdir(dir, (err, files) =>
    {
        if (err) return callback(err);
        var pending = files.length;
        if (!pending) return callback(null, results);
        files.forEach((file) =>
        {
            file = path.resolve(dir, file);
            fs.stat(file, (err, stat) =>
            {
                if (err) throw err;
                if (stat && stat.isDirectory())
                {
                    walk(file, (err, res) =>
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