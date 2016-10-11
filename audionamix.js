/**
* Audionamix Node.js API Client
* @author Loreto Parisi (loretoparisi at gmail dot com)
* @2016 Loreto Parisi
*/
(function() {

// Node modules
var http = require('http');
var crypto = require('crypto');
var fs = require("fs");
var qs = require('querystring');
var request = require('request');

var API = require('./lib/api');
var Util = require('./lib/util');
var FileUtil = require('./lib/fileutil');

var Audionamix;
Audionamix = (function() {

    /**
     *  Audionamix Node.js API Client
     * @see https://audionamix.com
     */
    function Audionamix(options) {

        // default options
        this._options = {
            clientId : "Musixmatch",
            // to be used in header: "Authorization: ApiKey username:api_key"
            accessKey : process.env.AUDIONAMIX_ACCESS_KEY || '',
            accessSecret : process.env.AUDIONAMIX_SECRET || '',
            host : "trax.audionamix.com",
            port : 80,
            endpoint: '/api/v1',
            secure : true, // true to use https
            debug : true
        };

        // override defaults
        for (var attrname in options) { this._options[attrname] = options[attrname]; }

        this.api = new API(this._options.host, this._options.port, 1000 * 10, this._options.secure, this._options.debug,true);

        /**
         * Promisify function
         * @param fun function(Object,(Error,Object)) simple
         * @param params object
         * @return Promise
         */
        this.doCallP = function(fun,params) {
            var self=this;
            return new Promise((resolve, reject) => {
                fun(params, (err, res) => {
                  if(!err) return resolve(res) 
                  else return reject(err);
                });
            });
        } //doCallP
        
    }

    /**
     * Upload audio file
     * 
     * To upload an audio file, you need to do a POST request to the audiofile resource with the content of your audio file set to the file field of a multipart body. 
     * The response's JSON id attribute is the identifier of the audio file and will be used during next step.
     * @uses request 
     * @see https://github.com/request/request
     * @example
      cURL 
      curl -X POST "https://trax.audionamix.com/api/v1/audiofile/" -F file=@path/to/ file.wav 
      curl -s -X GET -H "Authorization: ApiKey $AUDIONAMIX_ACCESS_KEY:$AUDIONAMIX_SECRET" -X POST "https://trax.audionamix.com/api/v1/audiofile/" -F file=@./sample.wav | json_pp
     * 
     * JSON Response
      
      {
        "file" : "https://.../sample.wav",
        "duration" : -1,
        "resource_uri" : "/api/v1/audiofile/284324/",
        "channel_number" : null,
        "original_file_type" : null,
        "valid" : true,
        "id" : 284324,
        "is_valid" : true
      }

     */
    Audionamix.prototype.upload = function(filePath, params, callback) {
        var self=this;

        var extras = {

        };
        for (var attrname in params) { extras[attrname] = params[attrname]; }

        var bitmap = fs.readFileSync( filePath );
        if( bitmap == null ) { // file read error
              var error = new Error("media file read error");
              console.error("error:\n%s", error.toString());
              var err = {
                "raw": {
                  "status": {
                    "msg": error.toString(),
                    "code": 3015,
                    "version": "1.0"
                  }
                }
              };
              return callback(err,null);
        }
        var formData = {
            file : new fs.createReadStream(filePath) // fs.createReadStream(filePath) | new Buffer(bitmap)
        };
        var headers = {
          "User-Agent" : this._options.clientId,
          "Accept" : "*/*",
          "Authorization" : "ApiKey "+this._options.accessKey+":"+this._options.accessSecret
        };
        var resultCallback = function (err, httpResponse, body) {
            if(err) {
              return callback(err,null);
            }
            else {
              try {
                var result = JSON.parse( body );
                return callback(null,result);
              } catch(ex) {
                console.log( body, ex.toString() )
                return callback( (new Error('upload bad json:'+ex.toString()) ), null);
              }
            }
        };
       
        var url=this._options.secure?'https://':'http://';
        url += this._options.host + this._options.endpoint+'/audiofile/';
        request.post({
            url: url,
            method: 'POST',
            headers: headers,
            formData: formData
          }, resultCallback);
          
    }//upload

    /**
     * Audio file pre-analysis
     * 
     * To start a pre-analysis, you need to do a GET request to the preanalysis/start subresource 
     * with the file_id URL parameter set to the audiofile identifier. 
     * This will start a pre-analysis as a background job. The response's JSON id attribute is the 
     * identifier of the preanalysis and will be * * used during next step.
     * 
     * @params = { file_id := number, alog := string, baseline := string }
     * 
     * where 
     * file_id the input file id
     * algo = csnt (consonant detection) | pitch (pitch detection); defaults=pitch
     * baseline = v1 | v3, version of the algorithm, best is v3;  defaults=v1
     * 
     * @example
     * curl -v -H "Authorization: ApiKey $AUDIONAMIX_ACCESS_KEY:$AUDIONAMIX_SECRET" -X GET "https://trax.audionamix.com/api/v1/preanalysis/start/?file_id=$AUDIOFILE_ID" | json_pp
     */
    Audionamix.prototype.preanalysis = function(params,callback) {
      var self=this;
      var headers = {
          "User-Agent" : this._options.clientId,
          "Accept" : "*/*",
          "Authorization" : "ApiKey "+this._options.accessKey+":"+this._options.accessSecret
      };
      var extras = {
        algo : 'pitch',
        baseline : 'v3'
      };
      for (var attrname in params) { extras[attrname] = params[attrname]; }
      
      var url = this._options.endpoint+'/preanalysis/start/';
      this.api.RequestGet(url, headers, extras
        , function(response) { // success
          return callback(null,response)
        }
        , function(error) { // error
          return callback(error);
        }
        , function(error) { // timeout
          return callback( new Error('request timed out') )
        });
    }//preanalysis

    /**
     * Start audio separation process
     * 
     * To start a separation, you need to do a GET request to the separation resource with file_id URL parameter set to the audio file identifier that you received above. 
     * This will start a separation as a background job. The response's JSON id attribute is the separation identifier and will be used during next step.
     * @param params Request options: { file_id : int } id of the uploaded resource
     * @example
     * curl -v -H "Authorization: ApiKey $AUDIONAMIX_ACCESS_KEY:$AUDIONAMIX_SECRET" -X GET "https://trax.audionamix.com/api/v1/separation/?file_id=$AUDIOFILE_ID" | json_pp
     * 
     * JSON Response
     
     * with file_id
     
      {
        "extracted_file_id": 284347,
        "id": 110605,
        "input_file_id": 284324,
        "resource_uri": "/api/v1/separation/110605/",
        "status": 1
      }

      * with file_id and config_id

      { 
        configuration_id: 334785,
        extracted_file_id: 316525,
        id: 121318,
        input_file_id: 316517,
        resource_uri: '/api/v1/separation/121318/',
        status: 1 
      }

     */
    Audionamix.prototype.separation = function(params,callback) {
      var self=this;
      var headers = {
          "User-Agent" : this._options.clientId,
          "Accept" : "*/*",
          "Authorization" : "ApiKey "+this._options.accessKey+":"+this._options.accessSecret
      };
      var extras = {
        
      };
      for (var attrname in params) { extras[attrname] = params[attrname]; }

      var url = this._options.endpoint+'/separation/';
      this.api.RequestGet(url, headers, extras
        , function(response) { // success
          return callback(null,response)
        }
        , function(error) { // error
          return callback(error);
        }
        , function(error) { // timeout
          return callback( new Error('request timed out') )
          });
        
    }//separation

    /**
     * Get audio files
     * 
     * @param params Request options: { file_id : int } id of the uploaded resource
     * @example
     * curl -v -H "Authorization: ApiKey $AUDIONAMIX_ACCESS_KEY:$AUDIONAMIX_SECRET" -X GET https://trax.audionamix.com/api/v1/audiofile/$AUDIOFILE_ID/ | json_pp
     * 
     * JSON Response (no file_id parameter)
     
       {
        "meta" : {
            "limit" : 20,
            "total_count" : 1,
            "next" : null,
            "previous" : null,
            "offset" : 0
        },
        "objects" : [
            {
              "resource_uri" : "/api/v1/audiofile/284324/",
              "duration" : -1,
              "id" : 284324,
              "channel_number" : null,
              "file" : "https://.../sample.wav",
              "valid" : true,
              "is_valid" : true,
              "original_file_type" : null
            }
        ]
      }

      * JSON Respose (by file_id parameter)

      {
        "channel_number": null,
        "duration": -1,
        "file": "https://.../sample.wav",
        "id": 284324,
        "is_valid": true,
        "original_file_type": null,
        "resource_uri": "/api/v1/audiofile/284324/",
        "valid": true
      }

     */
    Audionamix.prototype.files = function(params,callback) {
      var self=this;
      var headers = {
          "User-Agent" : this._options.clientId,
          "Accept" : "*/*",
          "Authorization" : "ApiKey "+this._options.accessKey+":"+this._options.accessSecret
      };
      var extras = {
        
      };
      for (var attrname in params) { extras[attrname] = params[attrname]; }

      var url = this._options.endpoint+'/audiofile/';
      if(params.file_id) {
        url += params.file_id+"/"; 
        delete extras.file_id;
      }
      this.api.RequestGet(url, headers, extras
        , function(response) { // success
          return callback(null,response)
        }
        , function(error) { // error
          return callback(error);
        }
        , function(error) { // timeout
          return callback( new Error('request timed out') )
          });
    }//files

    /**
     * Check separation status
     * 
     * You can check the progress of the separation job with a GET request on the separation resource you just created and look at the value of the status attribute in the JSON response. 
     * It shall be an integer value between 0 and 100. A value of 100 means that the separation is done and that you may download the resulting audio file, whose identifier is the extracted_file_id attribute.
     * 
     * @param params Request options: { file_id : int } id of the uploaded resource
     * @example
     * curl -v -H "Authorization: ApiKey $AUDIONAMIX_ACCESS_KEY:$AUDIONAMIX_SECRET" -X GET https://trax.audionamix.com/api/v1/separation/$SEPARATION_ID/ | json_pp
     * 
     * JSON Response (no file_id parameter)
     
       {
        "extracted_file_id": 284347,
        "id": 110605,
        "input_file_id": 284324,
        "resource_uri": "/api/v1/separation/110605/",
        "status": 100
      }

      * When a config_id was specified

        { 
          configuration_id: 334785,
          extracted_file_id: 316525,
          id: 121318,
          input_file_id: 316517,
          resource_uri: '/api/v1/separation/121318/',
          status: 100 
        }

     */
    Audionamix.prototype.status = function(params,status,callback) {
      var self=this;
      var headers = {
          "User-Agent" : this._options.clientId,
          "Accept" : "*/*",
          "Authorization" : "ApiKey "+this._options.accessKey+":"+this._options.accessSecret
      };
      var extras = {
        
      };
      for (var attrname in params) { extras[attrname] = params[attrname]; }

      var url = this._options.endpoint+'/'+status;
      if(params.file_id) {
        url += params.file_id+"/"; 
        delete extras.file_id;
      }
      this.api.RequestGet(url, headers, extras
        , function(response) { // success
          return callback(null,response)
        }
        , function(error) { // error
          return callback(error);
        }
        , function(error) { // timeout
          return callback( new Error('request timed out') )
          });
    }//status

    /**
     * Download extracted audio file
     * 
     * @param params { pk : extracted_audiofile_id }
     * To download the resulting audio file with the extracted sound, do a GET request to the audiofile resource with the pk URL parameter set to the audiofile id. This will redirect to the location of the audio file
     * @uses request 
     * @see https://github.com/request/request
     * @example
     * cURL 
     * curl -v -H "Authorization: ApiKey $AUDIONAMIX_ACCESS_KEY:$AUDIONAMIX_SECRET" -X GET "https://trax.audionamix.com/api/v1/audiofile/?pk=$EXTRACTED_AUDIOFILE_ID" -L -o path/to/result_$EXTRACTED_AUDIOFILE_ID.wav
     */
    Audionamix.prototype.download = function(params,path,callback) {
      var self=this;
      var headers = {
          "User-Agent" : this._options.clientId,
          "Accept" : "*/*",
          "Authorization" : "ApiKey "+this._options.accessKey+":"+this._options.accessSecret
      };
      var extras = {
        
      };
      for (var attrname in params) { extras[attrname] = params[attrname]; }
      
      var url=this._options.secure?'https://':'http://';
      url += this._options.host + this._options.endpoint+'/audiofile/';
      var queryString=qs.stringify(params);
      
      if( queryString ) {
        url+="?"+queryString;
      }
      var options={};
      options.url=url;
      options.followAllRedirects=true;
      options.maxRedirects = 10;
      options.headers = headers;

      var req = request(options);
      req.on('error', function(err) {
        return callback(error);
      })
      req.on('response',  function (res) {
        if(self._options.debug) {
          console.log("Status code:",res.statusCode) // 200
          console.log("Response headers", res.headers);
        }
        res.pipe(fs.createWriteStream(path) );
        res.on( 'end', function() {
          return callback(null,path);
        })
      });
    }//download

    /**
     * Download annotation file
     * 
     * To download the resulting annotation file, you need to do a GET request to the result subresource of the preanalysis you created. 
     * The result is a JSON file containing a lot a numerical data and a few parameters that you can edit.
     * @param params { preanalysis_id := number }
     * @uses request 
     * @see https://github.com/request/request
     * @example
     * cURL 
     * curl -v -H "Authorization: ApiKey $AUDIONAMIX_ACCESS_KEY:$AUDIONAMIX_SECRET" -X GET "https://trax.audionamix.com/api/v1/preanalysis/$PREANALYSIS_ID/result/" -L -o path/to/annotation_$PREANALYSIS_ID.json
     */
    Audionamix.prototype.annotation = function(params,path,callback) {
      var self=this;
      var headers = {
          "User-Agent" : this._options.clientId,
          "Accept" : "*/*",
          "Authorization" : "ApiKey "+this._options.accessKey+":"+this._options.accessSecret
      };
      var extras = {
        
      };
      for (var attrname in params) { extras[attrname] = params[attrname]; }
      
      var url=this._options.secure?'https://':'http://';
      url += this._options.host + this._options.endpoint+'/preanalysis/';
      if(params.preanalysis_id) {
        url += params.preanalysis_id+"/result/";
      }

      var options={};
      options.url=url;
      options.followAllRedirects=true;
      options.maxRedirects = 10;
      options.headers = headers;

      //options.removeRefererHeader=true;
      /*options.followRedirect = function(response) {
        var url = require('url');
        var _from = response.request.href;
        var _to = url.resolve(response.headers.location, response.request.href);
        return true;
      };*/

      if(self._options.debug) console.log(options)
      
      var req = request(options);
      req.on('error', function(err) {
        return callback(error);
      })
      req.on('response',  function (res) {
        if(self._options.debug) {
          console.log("Status code:",res.statusCode) // 200
          console.log("Response headers", res.headers);
        }
        if( res.statusCode == 200 ) {
          res.pipe(fs.createWriteStream(path) );
        }
        res.on( 'end', function() {
          return callback(null,path);
        })
      });
      
    }//annotation

    /**
     * You need to upload the configuration to TraxCloud, 
     * using a POST request to the configuration resource with a JSON body being the configuration created at the previous step . 
     * The response's JSON id attribute is the identifier of the configuration and will be used during next step.
     * 
     * @param params query string
     * @param path annotation file path
     * * @example
     * cURL 
     * curl -H "Authorization: ApiKey $AUDIONAMIX_ACCESS_KEY:$AUDIONAMIX_SECRET" -X POST "https://trax.audionamix.com/api/v1/configuration/" -H "Content-Type:application/json" -d @path/to/config.json
     *
     * Response format:
     * 
        {
            big_dipper: true,
            breathiness: false,
            consonants_activity: '[]',
            extra_parameters_patch: '',
            high_quality: false,
            id: 334785,
            maximum_frequency: -1,
            minimum_frequency: -1,
            panning_vector: null,
            pitch_annotation: '[]',
            ,preference_name: null,
            processed_segments: null,
            rectangle_annotation: '[]',
            resource_uri: '/api/v1/configuration/334785/',
            reverb_time: 0,
            voice_activity: null
        }
     */
    Audionamix.prototype.configuration = function(params,path,callback) {
      var self=this;
      var headers = {
          "User-Agent" : this._options.clientId,
          "Content-Type" : "application/json",
          "Accept" : "*/*",
          "Authorization" : "ApiKey "+this._options.accessKey+":"+this._options.accessSecret
      };
      var extras = {
        
      };
      for (var attrname in params) { extras[attrname] = params[attrname]; }

      // read file as json body
      var body=FileUtil.readFileSync(path,true);
      if(!body) {
        return callback( new Error('body error') )  
      }
      var url = this._options.endpoint+'/configuration/';
      this.api.RequestPost(url, headers, extras, body
        , function(response) { // success
          return callback(null,response)
        }
        , function(error) { // error
          return callback(error);
        }
        , function(error) { // timeout
          return callback( new Error('request timed out') )
          });
    }//configuration

    /**
     * API background job statuses
     */
    Audionamix.Status = {};

    /**
     * the progress of the preanalysis job
     */
    Audionamix.Status.PreAnalysis = 'preanalysis/';

    /**
     * the progress of the separation job
     */
    Audionamix.Status.Separation = 'separation/';
    
    return Audionamix;

})();

module.exports = Audionamix;

}).call(this);

