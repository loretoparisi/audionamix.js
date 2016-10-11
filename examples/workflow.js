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
var FileUtil = require('../lib/fileutil');
var aud = new Audionamix({
    debug: false,
    accessKey: process.env.AUDIONAMIX_ACCESS_KEY,
    accessSecret: process.env.AUDIONAMIX_SECRET
});

// upload audio file
var arguments = process.argv.slice(2);
var songFile=arguments[0];
var timeInterval=arguments[1] || 5;

if( !songFile ) {
	console.error("*** Audionamix client v1.0.0 ***\nhttps://github.com/loretoparisi/audionamix.js\n@@2016 Loreto Parisi (loretoparisi@gmail.com)\n\nUsage: worflow fileName [poll_interval_seconds]");
	process.exit(1);
}

/// /1-Upload
console.log("Uploading...",songFile);
aud.upload(songFile, {}, function(error, results) {
    if(error) 
        console.error("%s", error.toString() );
    else if(results) {

        console.log("upload", results);

        /// 2-Preanalysis pitch
        var fileId = results.id;
        var algo = 'pitch';
        console.log("\nPreanalysis on file_id:%s and algorithm %s", fileId, algo);
        aud.preanalysis({ file_id : fileId, algo : algo }, function(error, results) {
            if(error) 
                console.error("%s", error.toString() );
            else if(results) {
                console.log("preanalysis", results);
                var preanalysisId1 = results.id;
                /// 3-Preanalysis csnt
                algo = 'csnt';
                console.log("\nPreanalysis on file_id:%s and algorithm %s", fileId, algo);
                aud.preanalysis({ file_id : fileId, algo : algo }, function(error, results) {
                    if(error) 
                        console.error("%s", error.toString() );
                    else if(results){
                        console.log("preanalysis", results);
                        /// 4-Preanalysis status
                        var preanalysisId2 = results.id;
                        var status;
                        console.log("Checking preanalysis %s status...", preanalysisId1);
                        status=setInterval(function() {
                            aud.status({ file_id : preanalysisId1 }, Audionamix.Status.PreAnalysis
                            , function(error, results) {
                                if(error) 
                                    console.error("%s", error.toString() );
                                else if(results){
                                    console.log("%s \nTo stop press Ctrl-C\nstatus\n", (new Date()),results);
                                    if (results.is_finished || parseInt( results.status ) == 100 ) {
                                        clearInterval( status );
                                        /// 5-Preanalysis status
                                        console.log("Checking preanalysis %s status...", preanalysisId2);
                                        status=setInterval(function() {
                                            aud.status({ file_id : preanalysisId2 }, Audionamix.Status.PreAnalysis
                                            , function(error, results) {
                                                if(error) 
                                                    console.error("%s", error.toString() );
                                                else if(results){
                                                    console.log("%s \nTo stop press Ctrl-C\nstatus\n", (new Date()),results);
                                                    if (results.is_finished || parseInt( results.status ) == 100 ) {
                                                        clearInterval( status );
                                                        /// 6-Preanalysis annotation
                                                        aud.annotation({ preanalysis_id : preanalysisId1 }, 
                                                            './annotation_'+preanalysisId1+'.json', function(error, results) {
                                                            if(error) 
                                                                console.error("%s", error.toString() );
                                                            else {
                                                                var annotationFile1=results;
                                                                console.log("annotation", results);
                                                                aud.annotation({ preanalysis_id : preanalysisId2 }, 
                                                                    './annotation_'+preanalysisId2+'.json', function(error, results) {
                                                                    if(error) 
                                                                        console.error("%s", error.toString() );
                                                                    else {
                                                                        console.log("annotation", results);
                                                                        var annotationFile2=results;
                                                                        setTimeout(function() {
                                                                            /// 7-merge annotations
                                                                            var annotation1 = FileUtil.readFileSync(annotationFile1,true);
                                                                            var annotation2 = FileUtil.readFileSync(annotationFile2,true);
                                                                            if(annotation1 && annotation2) {
                                                                                for(var key in annotation2) {
                                                                                    annotation1[key] = annotation2[key]
                                                                                }
                                                                                var configurationFile='./annotation_'+preanalysisId1+'_'+preanalysisId2+'.json';
                                                                                FileUtil.writeToFileSync(configurationFile, JSON.stringify(annotation1));
                                                                                if( FileUtil.checkFileSync(configurationFile) ) {
                                                                                    /// 8-upload merged annotations
                                                                                    console.log("Uploading merged annotations %s", configurationFile);
                                                                                    aud.configuration({}, configurationFile, function(error, results) {
                                                                                        if(error) 
                                                                                            console.error("%s", error.toString() );
                                                                                        else {
                                                                                            console.log("configuration", results);
                                                                                            var configurationId=results.id;
                                                                                            /// 9-separation
                                                                                            aud.separation({ file_id : fileId, config_id : configurationId }, function(error, results) {
                                                                                                if(error) 
                                                                                                    console.error("%s", error.toString() );
                                                                                                else if(results){
                                                                                                    console.log("separation", results);
                                                                                                    var separationId=results.id;
                                                                                                    /// 10-separation status
                                                                                                    console.log("Checking separation %s status...", separationId);
                                                                                                    status=setInterval(function() {
                                                                                                    aud.status({ file_id : separationId }, Audionamix.Status.Separation
                                                                                                    , function(error, results) {
                                                                                                        if(error) 
                                                                                                            console.error("%s", error.toString() );
                                                                                                        else if(results){
                                                                                                            console.log("%s \nTo stop press Ctrl-C\nstatus\n", (new Date()),results);
                                                                                                            if (parseInt( results.status ) == 100) {
                                                                                                                clearInterval( status );   
                                                                                                                var extractedFileId=results.extracted_file_id;
                                                                                                                /// 11-download extracted
                                                                                                                aud.download({ pk : extractedFileId }, 
                                                                                                                    './sample_extracted_'+extractedFileId+'.wav', function(error, results) {
                                                                                                                    if(error) 
                                                                                                                        console.error("%s", error.toString() );
                                                                                                                    else {
                                                                                                                        console.log("download", results);
                                                                                                                    }
                                                                                                                });
                                                                                                            }
                                                                                                        }
                                                                                                    });
                                                                                                }, timeInterval * 1000);
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    });                                
                                                                                }
                                                                            }
                                                                        }, timeInterval * 1000);
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                }
                                            });
                                        }, timeInterval * 1000);

                                    }
                                }
                            });
                        }, timeInterval * 1000);
                    }
                });
            }
        });
    }
});

}).call(this);
