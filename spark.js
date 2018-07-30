var fs = require('fs');
var path = require('path');

function Spark() {
    this._documents = [];
    this._globalMap = {};
}

module.exports = Spark;

Spark.prototype.addDocument = function(data, id) {
    if (!id) {
        id = generateUniqueID(this._documents);
    }
    var documentMap = {};
    data = data.replace(/[^\w\s]/gi, '');
    var words = data.split(' ');
    var numWords = 0;
    words.forEach((word) => {
        if (!word) {
            return;
        }
        word = word.toLowerCase();
        numWords++;
        if (documentMap[word]) {
            documentMap[word] = documentMap[word] + 1;
        } else {
            documentMap[word] = 1;
            if (this._globalMap[word]) {
                this._globalMap[word] = this._globalMap[word] + 1;
            } else {
                this._globalMap[word] = 1;
            }
        }
    });
    this._documents.push({id: id, documentMap: documentMap, numWords: numWords});
}

/**
 * Adds a file from disk
 * @param {string} filename 
 */
Spark.prototype.addFileSync = function(filename) {
    if (!isTextFile(filename)) {
        console.log("Warning: " + filename + " not added because it is not a text file.");
        return;
    }
    try {
        var data = fs.readFileSync(filename, 'utf8');
        this.addDocument(data, path.basename(filename));
    } catch(err) {
        console.error(err);
    }
}

/**
 * Creates TFIDF from word maps.
 * http://www.tfidf.com/
 * @param {dictionary} globalMap The global word map
 * @param {array} fileMaps The list of file mapss
 */
Spark.prototype.tfidf = function() {
    var tfidfMaps = [];
    var numFiles = this._documents.length;    
    this._documents.forEach((documents) => {
        var tfidfMap = {};
        for (var key in documents.documentMap) {
            var tf = documents.documentMap[key] / documents.numWords;
            var idf = numFiles / this._globalMap[key];
            var tfidf = tf * idf;
            tfidfMap[key] = tfidf;
        }
        tfidfMaps.push({id: documents.id, tfidf: tfidfMap});
    });
    return tfidfMaps;
}

/**
 * Removes a document from the list, and removes values from the global map.
 * @param {id} id The ID of the document to be removed.
 */
Spark.prototype.removeDocument = function(id) {
    for (var i = 0; i < this._documents.length; i++) {
        if (this._documents[i].id != id) {
            continue;
        }
        for (var key in this._documents[i].documentMap) {
            //delete documents[i].documentMap[key];
            this._globalMap[key] = this._globalMap[key] - this._documents[i].documentMap[key];
            if (this._globalMap[key] === 0) {
                delete this._globalMap[key];
            }
        }
        delete this._documents[i];
        this._documents.splice(i, 1);
        break;
    }
}

/**
 * Checks if the filename is a text file or not
 * @param {string} name The filename 
 * @param {array} extensions Addition extensions
 */
function isTextFile(name, extensions) {
    var extname = path.extname(name);
    if (extname === '.txt' || extname === '.doc' || extname === '.docx') {
        return true;
    }
    if (extensions) {
        var shouldAdd = false;
        extensions.forEach((extension) => {
            if (extname === extension) {
                shouldAdd = true;
                return true;
            }
        });
        return shouldAdd;
    }
}

/**
 * Generates a unique ID
 * @param {array} documents The array of documents
 */
function generateUniqueID(documents) {
    var ids = [];
    documents.forEach((document) => {
        ids.push(document.id);
    });
    while (true) {
        var id = Math.floor(Math.random() * Math.floor(ids.length * 10));
        if (!ids.includes(id)) {
            return id;
        }
    }
}
// TODO: style fixes
// TODO: rename word to tokens
// TODO: addDirectory
// TODO: ngram functionality
// TODO: cosine similarity
// TODO: document comparisons
// TODO: search for synonyms