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

// upload audio file
var arguments = process.argv.slice(2);
var songFile=arguments[0];
if( !songFile ) {
	console.error("Usage: upload fileName");
	process.exit(1);
}
console.log("Uploading...",songFile);
aud.upload(songFile, {}, function(error, results) {
    if(error) 
        console.error("%s", error.toString() );
    else 
        console.log("upload", results);
});

}).call(this);
