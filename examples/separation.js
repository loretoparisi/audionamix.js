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

// start separation: input_file_id
var arguments = process.argv.slice(2);
var fileId=arguments[0];
if( !fileId ) {
	console.error("Usage: node separation fileId");
	process.exit(1);
}

aud.separation({ file_id : fileId }, function(error, results) {
    if(error) 
        console.error("%s", error.toString() );
    else 
        console.log("separation", results);
});

}).call(this);
