var spark = require('../spark.js');

function runTests()
{
    var files = spark.createJSONFilesSync('./text_files', true);
    if (files.includes('./text_files/lorem.txt') && files.includes('./text_files/subdir/lorem2.txt') && files.includes('./text_files/subdir/subdir2/lorem3.txt') && files.length == 3)
    {
        console.log("Passed.");
    } else
    {
        console.log("Failed.");
    }
}

runTests();