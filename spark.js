var fs = require('fs');
var path = require('path');

function Spark() {
    this._documents = [];
    this._globalMap = {};
    this._model = 'bag';
    this._n = 3;
}

module.exports = Spark;

/**
 * 
 * @param {string} data The data in string format
 * @param {string} id The id
 */
Spark.prototype.addDocument = function(data, id) {
    if (!id) {
        id = generateUniqueID(this._documents);
    }
    var documentMap = {};
    data = data.replace(/[^\w\s]/gi, '');
    var tokens = getTokens(data, this._model, this._n);
    var numTokens = 0;
    tokens.forEach((token) => {
        if (!token) {
            return;
        }
        token = token.toString().toLowerCase();
        numTokens++;
        if (documentMap[token]) {
            documentMap[token] = documentMap[token] + 1;
        } else {
            documentMap[token] = 1;
            if (this._globalMap[token]) {
                this._globalMap[token] = this._globalMap[token] + 1;
            } else {
                this._globalMap[token] = 1;
            }
        }
    });
    this._documents.push({id: id, model: this._model, documentMap: documentMap, numTokens: numTokens});
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
 * Creates TFIDF from token maps.
 * http://www.tfidf.com/
 * @param {dictionary} globalMap The global token map
 * @param {array} fileMaps The list of file mapss
 */
Spark.prototype.tfidf = function() {
    var tfidfMaps = [];
    var numFiles = this._documents.length;    
    this._documents.forEach((documents) => {
        var tfidfMap = {};
        for (var key in documents.documentMap) {
            var tf = documents.documentMap[key] / documents.numTokens;
            var idf = numFiles / this._globalMap[key];
            var tfidf = tf * idf;
            tfidfMap[key] = tfidf;
        }
        tfidfMaps.push({id: documents.id, model: documents.model, tfidf: tfidfMap});
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
 * Sets model that is used for documents
 * @param {string} model The model
 */
Spark.prototype.setModel = function(model) {
    // TODO: add list of models, check against them
    this._model = model.toLowerCase();
}

/**
 * Sets n that's used for ngram
 * @param {integer} n The n used
 */
Spark.prototype.setN = function(n) {
    this._n = n;
}

/**
 * Parses the data and splits it into tokens
 * @param {string} data The data in string form
 * @param {*} model 
 */
function getTokens(data, model, n) {
    if (model.toLowerCase() === 'bag') {
        return data.split(' ');
    } else if (model.toLowerCase() === 'ngram-char') {
        var ngramArray = [];
        var ngram = '';
        for (var i = 0; i < data.length; i++) {
            if (i == data.length-1) {
                if (data[i]) {
                    ngram += data[i];
                }
                ngramArray.push(ngram);
                break;
            }
            if (data[i]) {
                ngram += data[i];
                if (ngram.length == n) {
                    ngramArray.push(ngram);
                    ngram = '';
                }
            }
        }
        return ngramArray;
    } else if (model.toLowerCase() === 'ngram-word') {
        var splitData = data.split(' ');
        console.log(splitData);
        var ngramArray = [];
        var ngram = [];
        for (var i = 0; i < splitData.length; i++) {
            if (i == splitData.length-1) {
                if (splitData[i]) {
                    ngram.push(splitData[i]);
                }
                var ngramStr = '';
                for (var j = 0; j < ngram.length; j++) {
                    ngramStr += ngram[j];
                    if (j != ngram.length-1) {
                        ngramStr += ' ';
                    }
                }
                ngramArray.push(ngramStr);
                break;
            }
            if (splitData[i]) {
                ngram.push(splitData[i]);
                if (ngram.length == n) {
                    var ngramStr = '';
                    for (var j = 0; j < n; j++) {
                        ngramStr += ngram[j];
                        if (j != n-1) {
                            ngramStr += ' ';
                        }
                    }
                    ngramArray.push(ngramStr);
                    ngram = [];
                }
            }
        }
        return ngramArray;
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

// TODO: addDirectory
// TODO: cosine similarity
// TODO: document comparisons i.e. nearest neighbor
// TODO: search for synonyms
// TODO: write to file, clear cache
// TODO: remove numbers boolean