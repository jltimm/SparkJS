var fs = require('fs');
var path = require('path');

function Spark() {
    this._documents = [];
    this._globalMap = new Map();
    this._model = 'bag';
    this._synonyms = new Map();
    this._n = 3;
    this._stopWords = new Map();
    this._noisyLogging = false;
}

module.exports = Spark;

/**
 * Adds a document to to the corpus
 * @param {string} data The data in string format
 * @param {string} id The id
 * @param {boolean} shouldRemoveNumbers Should numbers be removed from the document
 * @param {boolean} isUpdate If this document is being updated
 */
Spark.prototype.addDocument = function(data, id, shouldRemoveNumbers, isUpdate) {
    if (!id) {
        id = generateUniqueID(this._documents);
    }
    if (this._noisyLogging) {
        if (isUpdate) {
            console.info("INFO: Updating document: " + id);
        } else {
            console.info("INFO: Adding document: " + id);
        }
    }
    var documentMap = new Map();
    data = data.replace(/[^\w\s]/gi, '');
    if (shouldRemoveNumbers) {
        data = data.replace(/[0-9]/g, '');
    }
    const tokens = getTokens(data, this._model, this._n);
    let numTokens = 0;
    tokens.forEach((token) => {
        if (!token || (this._stopWords.has(token))) {
            return;
        }
        token = token.toString().toLowerCase();
        numTokens++;
        if (documentMap.has(token)) {
            documentMap.set(token, documentMap.get(token) + 1);
        } else {
            documentMap.set(token, 1);
            const value = this._globalMap.get(token);
            if (value) {
                this._globalMap.set(token, value + 1);
            } else {
                this._globalMap.set(token, 1);
            }
        }
    });
    this._documents.push({id: id, model: this._model, documentMap: documentMap, numTokens: numTokens});
}

/**
 * Adds a file or directory from disk
 * @param {string} filename The filename
 * @param {boolean} shouldRemoveNumbers If the numbers should be removed from the files
 * @param {boolean} isUpdate If this document is being updated
 */
Spark.prototype.addFileSync = function(filename, shouldRemoveNumbers, isUpdate) {
    var isDirectory = fs.lstatSync(filename).isDirectory();
    if (!isDirectory && !isTextFile(filename)) {
        console.warn("WARNING: " + filename + " not added because it is not a text file.");
        return;
    }
    try {
        if (isDirectory) {
            var files = fs.readdirSync(filename);
            files.forEach(file => {
                this.addFileSync(filename + '/' + file);
            });
        } else {
            const data = fs.readFileSync(filename, 'utf8');
            this.addDocument(data, filename, shouldRemoveNumbers, isUpdate);
        }
    } catch(err) {
        console.error(err);
    }
}

/**
 * Creates TFIDF from token maps.
 * http://www.tfidf.com/
 */
Spark.prototype.tfidf = function() {
    var tfidfMaps = [];
    const numFiles = this._documents.length;   
    this._documents.forEach((documents) => {
        let score = 0.0;
        var tfidfMap = new Map();
        for (const [key, value] of documents.documentMap.entries()) {
            const tf = value / documents.numTokens;
            const idf = Math.log(numFiles / this._globalMap.get(key));
            const tfidf = tf * idf;
            tfidfMap.set(key, tfidf);
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
        for (const [key, value] of this._documents[i].documentMap.entries()) {
            const newValue = this._globalMap.get(key) - value;
            if (newValue === 0) {
                this._globalMap.delete(key);
            }
        }
        delete this._documents[i];
        this._documents.splice(i, 1);
        if (this._noisyLogging) {
            console.info("INFO: Document removed: " + id);
        }
        break;
    }
}

/**
 * Updates the file that already exists in the document array
 * @param {string} filename The filename
 * @param {boolean} shouldRemoveNumber If numbers should be removed from the files
 */
Spark.prototype.updateFileSync = function(filename, shouldRemoveNumbers) {
    for (var i = 0; i < this._documents.length; i++) {
        if (this._documents[i].id != path.basename(filename)) {
            continue;
        }
       delete this._documents[i];
       this._documents.splice(i, 1);
       this.addFileSync(filename, shouldRemoveNumbers, true);
       break;
    }
}

/**
 * Updates the data that already exists in the document array
 * @param {data} data The contents of the file
 * @param {int} id The id of the file
 * @param {boolean} shouldRemoveNumbers If the numbers should be removed
 */
Spark.prototype.updateDocument = function(data, id, shouldRemoveNumbers) {
    for (var i = 0; i < this._documents.length; i++) {
        if (this._documents[i].id != id) {
            continue;
        }
       delete this._documents[i];
       this._documents.splice(i, 1);
       this.addDocument(data, id, shouldRemoveNumbers);
       break;
    }
}

/**
 * Sets model that is used for documents
 * @param {string} model The model
 */
Spark.prototype.setModel = function(model) {
    const modelLowerCase = model.toLowerCase();
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
        console.warn("WARNING: " + n + " is either not a valid integer or less than 1. n will not be changed.");
    }
}

/**
 * Initializes the stop words.
 * @param {array} stopWords The stop words
 */
Spark.prototype.initStopWords = function(stopWords) {
    // TODO: Add more stop words, consider loading from file
    var stopWordsMap = new Map();
    if (!stopWords) {
        stopWords = ['I', 'a', 'about', 'an', 'are', 'as',
                     'at', 'be', 'by', 'for', 'from', 'how',
                     'in', 'is', 'it', 'of', 'on', 'or', 'that',
                     'the', 'this', 'to', 'was', 'what', 'when',
                     'where', 'who', 'will', 'with', 'the'];
    }
    for (var word in stopWords) {
        stopWordsMap.set(word, '');
    }
    this._stopWords = stopWordsMap;
}

/**
 * Initializes the stop words from a CSV file
 * @param {string} filename The full path for the csv file
 */
Spark.prototype.initStopWordsFromCSVFile = function(filename) {
    var stopWordsMap = new Map();
    if (this._stopWords) {
        stopWordsMap = this._stopWords;
    }
    var stopWords = fs.readFileSync(filename, 'UTF-8');
    var words = [];
    if (stopWords) {
        words = stopWords.split(',');
    }
    if (this._noisyLogging) {
        console.info("INFO: Adding " + words.length + " stop words.");
    }
    for (word in words) {
        stopWordsMap.set(word, '');
    }
    this._stopWords = stopWordsMap;
}

/**
 * Initializes the synonyms
 * @param {string} filepath The path to the synonyms file
 */
Spark.prototype.initSynonyms = function(filepath) {
    var synonymsMap = new Map();
    const contents = fs.readFileSync(filepath);
    const jsonContent = JSON.parse(contents);
    var numSynonyms = 0;
    for (var synonym in jsonContent) {
        var wordMap = new Map();
        const synonyms = jsonContent[synonym].synonyms;
        for (var i in synonyms) {
            wordMap.set(synonyms[i], null);
        }
        numSynonyms++;
        synonymsMap.set(synonym, wordMap);
    }
    if (this._noisyLogging) {
        console.info("INFO: Adding synonyms for " + numSynonyms + " words");
    }
    this._synonyms = synonymsMap;
}

/**
 * Set to true if noisy logging is preferred.
 * @param {boolean} shouldLog The boolean to set logging
 */
Spark.prototype.initNoisyLogging = function(shouldLog) {
    if (shouldLog) {
        console.info("INFO: Noisy logging initialized.");
    }
    this._noisyLogging = shouldLog;
}

/**
 * Compares two documents, returns cosine similarity score
 * @param {document} doc1 The first document
 * @param {document} doc2 The second document
 */
Spark.prototype.cosineSimilarity = function(doc1, doc2) {
    var topScore = 0.0;
    console.log(doc1);
    console.log(doc2);
    for (const [key, doc1Value] of doc1.tfidf.entries()) {
        const doc2Value = doc2.tfidf.get(key);
        if (doc2Value) {
            topScore += (doc1Value * doc2Value);
        } else if (this._synonyms) {
            const synonymScore = getSynonymScore(key, doc2.tfidf, this._synonyms);
            topScore += (doc1Value * synonymScore);
        }
    }
    const score = topScore / (Math.sqrt(doc1.score) * Math.sqrt(doc2.score));
    return score;
}

/**
 * Compares the two document, returns cosine similary score
 * @param {string} id1 The first id
 * @param {string} id2 The second id
 */
Spark.prototype.cosineSimilarityById = function(id1, id2) {
    var doc1;
    var doc2;
    for (const document of this.tfidf()) {
        if (document.id === id1) {
            doc1 = document;
        }
        if (document.id === id2) {
            doc2 = document;
        }
        if (doc1 != null && doc2 != null) {
            return this.cosineSimilarity(doc1, doc2);
        } 
    }
    if (doc1 == null && doc2 == null) {
        console.error("ERROR: documents with ids " + id1 + " and " + id2 + " were not found.");
    } else if (doc1 == null) {
        console.error("ERROR: document with id " + id1 + " was not found.");
    } else if (doc2 == null) {
        console.error("ERROR: document with id " + id2 + " was not found.");
    }
    return null;
}

/**
 * Writes tfidf to file, clears the cache
 * @param {string} filepath The filepath
 * @param {data} tfidf The tfidf data
 * @param {boolean} shouldClearCache The boolean determining if the cache should be cleared or not
 */
Spark.prototype.writeToFile = function(filepath, tfidf, shouldClearCache) {
    fs.writeFile(filepath, tfidf, (err) => {
        if (err) throw err;
        if (this._noisyLogging) {
            console.info("INFO: Writing tfidf to file: " + filepath);
        }
        if (shouldClearCache) {
            this._documents = [];
            this._globalMap = new Map();
            this._model = 'bag';
            this._n = 3;
            this._stopWords = new Map();
        }
    });
}

/**
 * Parses the data and splits it into tokens
 * @param {string} data The data in string form
 * @param {string} model The model 
 * @param {int} n The n being used
 */
function getTokens(data, model, n) {
    if (model.toLowerCase() === 'bag') {
        return data.split(' ');
    } else if (model.toLowerCase() === 'ngram-char') {
        return getNGramCharArray(data, n);
    } else if (model.toLowerCase() === 'ngram-word') {
        return getNGramWordArray(data, n);
    }
}

/**
 * Checks if any synonyms of the key exist in the map
 * @param {string} key The key
 * @param {map} tfidfMap The tfidf map
 * @param {array} synonyms The synonyms
 */
function getSynonymScore(key, tfidfMap, synonyms) {
    const synonymMap = synonyms.get(key);
    if (synonymMap) {
        for (const [key] of synonymMap.entries()) {
            const score = tfidfMap.get(key);
            if (score) {
                return score * 0.5;
            }
        }
    }
    return 0;
}

/**
 * Returns the ngram-char array
 * @param {string} data The data in string form 
 * @param {int} n The n
 */
function getNGramCharArray(data, n) {
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
}

/**
 * Returns the ngram-word array
 * @param {string} data The data in string form 
 * @param {int} n The n
 */
function getNGramWordArray(data, n) {
    const splitData = data.split(' ');
    var ngramArray = [];
    var ngram = [];
    for (var i = 0; i < splitData.length; i++) {
        if (i == splitData.length - 1) {
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

/**
 * Checks if the filename is a text file or not
 * @param {string} name The filename 
 * @param {array} extensions Additional extensions
 */
function isTextFile(name, extensions) {
    const extname = path.extname(name);
    if (extname === '.txt' || extname === '.doc' || extname === '.docx') {
        return true;
    }
    if (extensions) {
        extensions.forEach((extension) => {
            if (extname === extension) {
                return true;
            }
        });
        return false;
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
        const id = Math.floor(Math.random() * Math.floor(ids.length * 10));
        if (!ids.includes(id)) {
            return id;
        }
    }
}

// 1) cache tfidf
// 2) cache scores
// 3) document comparisons i.e. nearest neighbor
// 4) load from file into cache
// 5) figure out a way to make synonyms work for ngrams
// 6) more logging
// 7) save and reload state into json file