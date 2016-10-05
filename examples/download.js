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

// download file: "extracted_file_id"
var arguments = process.argv.slice(2);
var pk=arguments[0];
if( !pk ) {
	console.error("Usage: upload fileId");
	process.exit(1);
}
aud.download({ pk : pk }, 
    './sample_extracted_'+pk+'.wav', function(error, results) {
    if(error) 
        console.error("%s", error.toString() );
    else 
        console.log("download", results);
            
});

}).call(this);
