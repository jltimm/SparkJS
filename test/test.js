var Spark = require('../spark.js');

// These are going to fail until I figure out a way to test without hardcoding the full path
function runTests()
{
    // TODO: actually add tests
    var spark = new Spark();
    spark.addDocument('hello there', 1);
    spark.addDocument('hiiiiii', 2);
    spark.addDocument('hello there', 3);
    spark.addFileSync('text_files/lorem.txt');
    var tfidf = spark.tfidf();
}

runTests();