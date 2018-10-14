var Spark = require('../spark.js');

// These are going to fail until I figure out a way to test without hardcoding the full path
function runTests() {
    // TODO: actually add tests
    var synonymsFile = '/synonyms.json';
    var fullpath = __dirname + synonymsFile;
    var spark = new Spark();
    spark.initStopWords();
    spark.initSynonyms(fullpath);
    spark.setModel('bag');
    spark.setN(0);
    spark.addDocument('other', 1);
    spark.addDocument('hiiiiii', 2);
    spark.updateDocument('hello', 2);
    spark.addDocument('new new new alternative', 3);
    spark.addDocument('test');
    spark.addFileSync('text_files/lorem.txt');
    spark.updateFileSync('text_files/lorem.txt');
    var tfidf = spark.tfidf();
    console.log(spark.cosineSimilarity(tfidf[0], tfidf[2]));
}

runTests();