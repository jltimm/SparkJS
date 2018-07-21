var spark_sync = require('../spark-sync.js');
var spark = require('../spark.js');

// These are going to fail until I figure out a way to test without hardcoding the full path
function runTests()
{
    // Test 1
    var files = spark_sync.createJSONFilesSync('./text_files', true);
    if (files.includes('./text_files/lorem.txt') && files.includes('./text_files/subdir/lorem2.txt') && files.includes('./text_files/subdir/subdir2/lorem3.txt') && files.length == 3)
    {
        console.log("Test 1: passed.");
    } else
    {
        console.log("Test 1: failed.");
    }

    // Test 2
    spark.createJSONFiles('./text_files', function(err, asynchFiles)
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
}

runTests();