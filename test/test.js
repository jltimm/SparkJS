var spark = require('../spark.js');

function runTests()
{
    var files = spark.createJSONFilesSync('./text_files', true);
    console.log(files);
}

runTests();