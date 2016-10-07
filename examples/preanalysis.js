/**
* Audionamix Node.js API Client
* @author Loreto Parisi (loretoparisi at gmail dot com)
* @2016 Loreto Parisi
*/
(function() {

if (!process.env.AUDIONAMIX_ACCESS_KEY) {
    console.warn("Please set access key:\nexport AUDIONAMIX_ACCESS_KEY=xxxxxxxxxx")    
    process.exit(1);
}

if (!process.env.AUDIONAMIX_SECRET) {
    console.warn("Please set secret:\nexport AUDIONAMIX_SECRET=xxxxxxxxxx")    
    process.exit(1);
}

var Audionamix = require('../audionamix');
var aud = new Audionamix({
    debug: true,
    accessKey: process.env.AUDIONAMIX_ACCESS_KEY,
    accessSecret: process.env.AUDIONAMIX_SECRET
});

// start separation: input_file_id
var arguments = process.argv.slice(2);
var fileId=arguments[0];
var algo=arguments[1]||'';
if( !fileId ) {
	console.error("Usage: node preanalysis file_id [algorithm]\nalgorithm = pitch (defaults) |csnt");
	process.exit(1);
}
if( algo ) {
	console.error("Algorithm will be " + algo);
}
aud.preanalysis({ file_id : fileId, algo : algo }, function(error, results) {
    if(error) 
        console.error("%s", error.toString() );
    else 
        console.log("preanalysis", results);
});

}).call(this);
