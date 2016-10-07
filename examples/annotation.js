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

// download file: "extracted_file_id"
var arguments = process.argv.slice(2);
var preanalysis_id=arguments[0];
if( !preanalysis_id ) {
	console.error("Usage: upload preanalysisId");
	process.exit(1);
}
aud.annotation({ preanalysis_id : preanalysis_id }, 
    './annotation_'+preanalysis_id+'.json', function(error, results) {
    if(error) 
        console.error("%s", error.toString() );
    else 
        console.log("annotation", results);
            
});

}).call(this);
