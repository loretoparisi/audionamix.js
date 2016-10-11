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

// check status: "id"
var arguments = process.argv.slice(2);
var fileId=arguments[0];
if( !fileId ) {
	console.error("Usage: node preanalysis_status fileId [poll_interval_seconds]");
	process.exit(1);
}
var timeInterval=arguments[1] || 5;

// start status check
console.log("check status every %d secs.", timeInterval);
var status;
status=setInterval(function() {
    aud.status({ file_id : fileId }, Audionamix.Status.PreAnalysis
    , function(error, results) {
        if(error) 
            console.error("%s", error.toString() );
        else {
            console.log("%s \nTo stop press Ctrl-C\nstatus\n", (new Date()),results);
            if (results.is_finished || parseInt( results.status ) == 100 ) {
                clearInterval( status );    
            }
        }
    });
}, timeInterval * 1000);

}).call(this);
