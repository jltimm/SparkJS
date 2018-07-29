var fs = require('fs');
var path = require('path');

function Spark()
{
    this.documents = [];
    this.globalMap = {};
}

module.exports = Spark;

Spark.prototype.addDocument = function(data, id)
{
    //TODO: add check for ID
    var documentMap = {};
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
        if (documentMap[word])
        {
            documentMap[word] = documentMap[word] + 1;
        } else
        {
            documentMap[word] = 1;
            if (this.globalMap[word])
            {
                this.globalMap[word] = this.globalMap[word] + 1;
            } else
            {
                this.globalMap[word] = 1;
            }
        }
    });
    this.documents.push({id: id, documentMap: documentMap, numWords: numWords});
}

/**
 * Creates TFIDF from word maps.
 * http://www.tfidf.com/
 * @param {dictionary} globalMap The global word map
 * @param {array} fileMaps The list of file mapss
 */
Spark.prototype.tfidf = function()
{
    var tfidfMaps = [];
    var numFiles = this.documents.length;    
    this.documents.forEach((documents) =>
    {
        var tfidfMap = {};
        for (var key in documents.documentMap)
        {
            var tf = documents.documentMap[key] / documents.numWords;
            var idf = numFiles / this.globalMap[key];
            var tfidf = tf * idf;
            console.log(tfidf);
            tfidfMap[key] = tfidf;
        }
        tfidfMaps.push({id: documents.id, tfidf: tfidfMap});
    });
    return tfidfMaps;
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