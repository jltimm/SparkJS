var Spark = require('../spark.js');

// These are going to fail until I figure out a way to test without hardcoding the full path
function runTests()
{
    var spark = new Spark();
    spark.addDocument('hello there', 1);
    spark.addDocument('hiiiiii', 2);
    spark.addDocument('hello there', 3);
    var tfidf = spark.tfidf();
    console.log(tfidf);
}

runTests();