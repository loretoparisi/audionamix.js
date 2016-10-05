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

var Audionamix;
Audionamix = (function() {

    /**
     *  Audionamix Node.js API Client
     * @see https://audionamix.com
     */
    function Audionamix(options) {

        // default options
        this._options = {
            // to be used in header: "Authorization: ApiKey username:api_key"
            accessKey : process.env.AUDIONAMIX_ACCESS_KEY,
            accessSecret : process.env.AUDIONAMIX_SECRET,
            host : "trax.audionamix.com",
            port : 80,
            endpoint: '/api/v1',
            secure : true, // true to use https
            debug : true
        };

        // override defaults
        for (var attrname in options) { this._options[attrname] = options[attrname]; }

        this.api = new API(this._options.host, this._options.port, 1000 * 10, this._options.secure, this._options.debug,true);
        
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
      curl -s -X GET -H "Authorization: ApiKey YOUR_ACCESS_KEY:YOUR_ACCESS_SECRET" -X POST "https://trax.audionamix.com/api/v1/audiofile/" -F file=@./sample.wav | json_pp
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
     * Start audio separation process
     * 
     * To start a separation, you need to do a GET request to the separation resource with file_id URL parameter set to the audio file identifier that you received above. 
     * This will start a separation as a background job. The response's JSON id attribute is the separation identifier and will be used during next step.
     * @param params Request options: { file_id : int } id of the uploaded resource
     * @example
     * cURL curl -X GET "https://trax.audionamix.com/api/v1/separation/?file_id=audiofile_id"
     * 
     * JSON Response
     
      {
        "extracted_file_id": 284347,
        "id": 110605,
        "input_file_id": 284324,
        "resource_uri": "/api/v1/separation/110605/",
        "status": 1
      }

     */
    Audionamix.prototype.separation = function(params,callback) {
      var self=this;
      var headers = {
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
     * cURL curl -X GET https://trax.audionamix.com/api/v1/audiofile/audiofile_id/
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
     * cURL curl -X GET https://trax.audionamix.com/api/v1/separation/separation_id/
     * 
     * JSON Response (no file_id parameter)
     
       {
        "extracted_file_id": 284347,
        "id": 110605,
        "input_file_id": 284324,
        "resource_uri": "/api/v1/separation/110605/",
        "status": 100
      }

     */
    Audionamix.prototype.status = function(params,callback) {
      var self=this;
      var headers = {
          "Accept" : "*/*",
          "Authorization" : "ApiKey "+this._options.accessKey+":"+this._options.accessSecret
      };
      var extras = {
        
      };
      for (var attrname in params) { extras[attrname] = params[attrname]; }

      var url = this._options.endpoint+'/separation/';
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
     * curl -X GET "https://trax.audionamix.com/api/v1/audiofile/?pk=extracted_audiofile_id" -L -o path/to/result.wav
     */
    Audionamix.prototype.download = function(params,path,callback) {
      var self=this;
      var headers = {
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
      var req = request(url);
      req.on('error', function(err) {
        return callback(error);
      })
      req.on('response',  function (res) {
        //var ext=res.headers['content-type'].split('-')[1];
        res.pipe(fs.createWriteStream(path) );
        res.on( 'end', function() {
          return callback(null,path);
        })
      });
    }//download
    
    return Audionamix;

})();

module.exports = Audionamix;

}).call(this);

