var fs = require('fs');
var path = require('path');

function Spark() {
    this._documents = [];
    this._globalMap = {};
    this._model = 'bag';
    this._n = 3;
    this._stopWords = [];
}

module.exports = Spark;

/**
 * 
 * @param {string} data The data in string format
 * @param {string} id The id
 * @param {string} shouldRemoveNumbers Should numbers be removed from the document
 */
Spark.prototype.addDocument = function(data, id, shouldRemoveNumbers) {
    if (!id) {
        id = generateUniqueID(this._documents);
    }
    var documentMap = {};
    data = data.replace(/[^\w\s]/gi, '');
    if (shouldRemoveNumbers) {
        data = data.replace(/[0-9]/g, '');
    }
    var tokens = getTokens(data, this._model, this._n);
    var numTokens = 0;
    tokens.forEach((token) => {
        if (!token || (this._stopWords.indexOf(token) > -1)) {
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
        var score = 0.0;
        var tfidfMap = {};
        for (var key in documents.documentMap) {
            var tf = documents.documentMap[key] / documents.numTokens;
            var idf = Math.log(numFiles / this._globalMap[key]);
            var tfidf = tf * idf;
            tfidfMap[key] = tfidf;
            score += (tfidf * tfidf);
        }
        tfidfMaps.push({id: documents.id, model: documents.model, tfidf: tfidfMap, score: score});
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
    var modelLowerCase = model.toLowerCase();
    if (modelLowerCase === 'bag' || modelLowerCase === 'ngram-char' || modelLowerCase == 'ngram-word') {
        this._model = model.toLowerCase();
    } else {
        console.warn("WARNING: " + model + " is not a valid model. Model will not be changed. Valid models are: 'bag', 'ngram-char', and 'ngram-word'");
    }
}

/**
 * Sets n that's used for ngram
 * @param {integer} n The n used
 */
Spark.prototype.setN = function(n) {
    if (Number.isInteger(n) && n > 0) {
        this._n = n;
    } else {
        console.warn("WARNING: " + n + " is either not a valid integer or less than 0. n will not be changed.");
    }
}

/**
 * Initializes the stop words.
 */
Spark.prototype.initStopWords = function() {
    // Add more stop words, consider moving to map instead of array
    this._stopWords = ['I', 'a', 'about', 'an', 'are', 'as',
                      'at', 'be', 'by', 'for', 'from', 'how',
                      'in', 'is', 'it', 'of', 'on', 'or', 'that',
                      'the', 'this', 'to', 'was', 'what', 'when',
                      'where', 'who', 'will', 'with', 'the'];
}

/**
 * Compares two documents, returns cosine similarity score
 */
Spark.prototype.cosineSimilarity = function(doc1, doc2) {
    var topScore = 0.0;
    for (var key in doc1.tfidf) {
        if (key in doc2.tfidf) {
            topScore += (doc1.tfidf[key] * doc2.tfidf[key]);
        }
    }
    var score = topScore / (Math.sqrt(doc1.score) * Math.sqrt(doc2.score));
    return score;
}

/**
 * Parses the data and splits it into tokens
 * @param {string} data The data in string form
 * @param {*} model 
 */
function getTokens(data, model, n) {
    //TODO: consider splitting into different functions for readability
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
// TODO: cache scores
// TODO: document comparisons i.e. nearest neighbor
// TODO: search for synonyms
// TODO: write to file, clear cache