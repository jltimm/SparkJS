var spark = require('../spark.js');

// These are going to fail until I figure out a way to test without hardcoding the full path
function runTests()
{
    spark.setDataDirectory("/Users/Jacob/Documents/github/SparkJS/test/data");

    spark.addFile('./test/add_text_files/test2/', (err) =>
    {
        if (err)
        {
            console.log("Test 1 failed.")
        }
    });

    // Test 3
    spark.addFile('./test/add_text_files/test3.txt', (err) =>
    {
        console.log("TEST 3");
    });


}

runTests();