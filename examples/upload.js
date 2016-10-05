/**
* Audionamix Node.js API Client
* @author Loreto Parisi (loretoparisi at gmail dot com)
* @2016 Loreto Parisi
*/
(function() {

// put this in the sdk headers
var Audionamix = require('../audionamix');
var aud = new Audionamix({
    debug : true
});

// upload audio file
//
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
