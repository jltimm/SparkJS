var spark_sync = require('../spark-sync.js');
var spark = require('../spark.js');

// These are going to fail until I figure out a way to test without hardcoding the full path
function runTests()
{
    // Test 1
    spark.createJSONFiles('./test/text_files', (err, asynchFiles) =>
    {
        if (err)
        {
            console.log("Test 2: failed.");
        } else
        {
            if (asynchFiles.includes('./text_files/lorem.txt') && asynchFiles.includes('./text_files/subdir/lorem2.txt') && asynchFiles.includes('./text_files/subdir/subdir2/lorem3.txt') && asynchFiles.length == 3)
            {
                console.log("Test 2: passed");
            } else
            {
                console.log("Test 2: failed");
            }
        }
    });
    // Test 2
    spark.addFile('./test/add_text_files/test2/', (err, data) =>
    {
        console.log("TEST 2");
    });

    // Test 3
    spark.addFile('./test/add_text_files/test3.txt', (err, data) =>
    {
        console.log("TEST 3");
    });
}

runTests();