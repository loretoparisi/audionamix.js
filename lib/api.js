/**
* Simple Node.js HTTP/HTTPS GET and POST client
* @author Loreto Parisi (loretoparisi at gmail dot com)
* @2015-2016 Loreto Parisi 
*/
(function() {

  var API;

  // for executables
  var cp = require('child_process');
  var fs = require('fs');
  var path = require('path');
  var Util = require('./util');

  API = (function() {

    var qs = require('querystring');

    /**
     * HTTPS / HTTP client
     * supports GET | POST
     */
    function API(host,port,timeout,ssl,debug,json) {

      // defaults url sign options to null to not sign
      this.urlsign = null;

      this.host=host;
      this.port=port;
      this.timeout=timeout;
      /** true to use ssl - defaults to true */
      this.ssl= (typeof(ssl)!='undefined')?ssl:true;
      /** true to console log */
      this.debug=debug;
      /** true to parse response as json - defaults to true */
      this.json= (typeof(json)!='undefined')?json:true;
      this.requestUrl='';
      
      if(ssl) { // use ssl
          this.http = require('https');
      } else { // go unsafe, debug only please
          this.http = require('http');
      }
      
    }

    /**
     * HTTP GET
     */
    API.prototype.RequestGet = function(path, headers, params, success, error, timeout) {
      var self=this;

      if(params) {
        var queryString=qs.stringify(params);
        if( queryString ) {
          path+="?"+queryString;
        }
      }
      // LP: remove host
      path = Util.parseUri(path).relative;
      var options = {
        headers : headers,
        hostname: this.host,
        path: path,
        method: 'GET'
      };
      if(this.port && this.port!='80') { // port only if ! 80
        options['port']=this.port;
      }
      if(self.debug) {
        console.log("API.RequestGet path:", path);
        console.log( "API.RequestGet headers", headers );
        console.log( "API.RequestGet querystring:\n", params );
      }
      var request=this.http.get(options, function(response) {

          if(self.debug) { // debug
            console.log("API.RequestGet Response.Headers:\n", response.headers );
          }

          // Continuously update stream with data
          var body = '';
          response.on('data', function(d) {
              body += d;
          });
          response.on('end', function() {
            try {
              if(self.json) {
                var jsonResponse=JSON.parse(body);
                if(success) return success( jsonResponse );
              }
              else {
                if(success) return success( body );
              }
            } catch(ex) { // bad json
              if(ex) return error(new Error( 'JSON.parse:'+ex.toString() ));
            }
          });
        });
        request.on('socket', function (socket) {
            socket.setTimeout( self.timeout );
            socket.on('timeout', function() {
                request.abort();
                if(timeout) return timeout( new Error('request timed out') );
            });
        });
        request.on('error', function (e) {
          // General error, i.e.
          //  - ECONNRESET - server closed the socket unexpectedly
          //  - ECONNREFUSED - server did not listen
          //  - HPE_INVALID_VERSION
          //  - HPE_INVALID_STATUS
          //  - ... (other HPE_* codes) - server returned garbage
          console.log(e);
          if(error) return error(e);
        });
        request.on('timeout', function () {
          // Timeout happend. Server received request, but not handled it
          // (i.e. doesn't send any response or it took to long).
          // You don't know what happend.
          // It will emit 'error' message as well (with ECONNRESET code).
          req.abort();
          if(timeout) return timeout( new Error('request timed out') );
        });

        self.requestUrl = (this.ssl?'https':'http') + '://' + request._headers['host'] + request.path;
        if(self.debug) {
          console.log("API.RequestGet",self.requestUrl);
        }
        request.end();
    } //RequestGet

    /**
     * HTTP POST
     */
    API.prototype.RequestPost = function(path, headers, params, body, success, error, timeout, json) {
      json=typeof(json)!='undefined'?json:this.json;
      var self=this;

      if(params) {
        var queryString=qs.stringify(params);
        if( queryString ) {
          path+="?"+queryString;
        }
      }
      var _headers = {};
      var bodyString = '';
      if( !self.json || !json) { // body is plain text
        if( typeof (body) == 'object' ) { // body is an object as form
          bodyString=qs.stringify(body)
        }
        else {
          bodyString=body;
        }
        _headers = {
          'Content-Length': Buffer.byteLength(bodyString)
        }
      }
      else { // body is json
        bodyString=JSON.stringify(body)
        _headers = {
          'Content-Length': Buffer.byteLength(bodyString)
        };
      }

      for (var attrname in headers) { _headers[attrname] = headers[attrname]; }

      var options = {
        headers : headers,
        hostname: this.host,
        path: path,
        method: 'POST',
        qs : qs.stringify(params)
      };
      if(this.port && this.port!='80') { // port only if ! 80
        options['port']=this.port;
      }
      if(self.debug) {
        console.log("API.RequestPost path:", path);
        console.log("API.RequestPost headers", headers );
        console.log("API.RequestPost querystring:\n", params );
        //console.log("API.RequestPost body:\n", bodyString );
      }
      var request=this.http.request(options, function(response) {

          if(self.debug) { // debug
            console.log( JSON.stringify(response.headers) );
          }

          // Continuously update stream with data
          var body = '';
          response.on('data', function(d) {
              body += d;
          });
          response.on('end', function() {
            try {
                if(self.json) { // response as json
                  var jsonResponse=JSON.parse(body);
                  if(success) return success( jsonResponse );
                }
                else { // response text
                  if(success) return success( body );
                }
            } catch(ex) { // bad json
              if(error) return error(new Error( 'JSON.parse:'+ex.toString() ));
            }
          });

        });
        request.on('socket', function (socket) {
            socket.setTimeout( self.timeout );
            socket.on('timeout', function() {
                request.abort();
                if(timeout) return timeout( new Error('request timed out') );
            });
        });
        request.on('error', function (e) {
          // General error, i.e.
          //  - ECONNRESET - server closed the socket unexpectedly
          //  - ECONNREFUSED - server did not listen
          //  - HPE_INVALID_VERSION
          //  - HPE_INVALID_STATUS
          //  - ... (other HPE_* codes) - server returned garbage
          console.log(e);
          if(error) return error(e);
        });
        request.on('timeout', function () {
          // Timeout happend. Server received request, but not handled it
          // (i.e. doesn't send any response or it took to long).
          // You don't know what happend.
          // It will emit 'error' message as well (with ECONNRESET code).
          req.abort();
          if(timeout) return timeout( new Error('request timed out') );
        });

        self.requestUrl = (this.ssl?'https':'http') + '://' + request._headers['host'] + request.path;
        if(self.debug) {
          console.log("API.RequestPost",self.requestUrl);
        }
        request.write( bodyString );
        request.end();
    } //RequestPost

    /**
     * execute cURL command
     * @uses curl
     * @param path := string api path
     * @param headers json object { key : value}
     * @param parameters json object { key : value}
     * @param body json encodable object
     * @return Promise
    */
    API.prototype.curl = function(path,headers,parameters,body) {
      var self=this;

      self.requestUrl = (this.ssl?'https':'http') + '://' + self.host;
      if(this.port && this.port!='80') { // port only if ! 80
        self.requestUrl +=':'+this.port;
      }
      self.requestUrl += path;
      if(parameters) {
          self.requestUrl += '?'+qs.stringify(parameters);
      }
      if(self.debug) {
        console.log("API.curl",self.requestUrl);
      }
      return new Promise((resolve, reject) => {
        const args = [ self.requestUrl ];
        // map { key:value} header to "-H key:value" string array value
        for(var k in headers) {
          args.push('-H');
          args.push(k+': '+headers[k]);
        }
        args.push('--data-binary');
        args.push(JSON.stringify(body));
        const opts = {};
    		const cb = (error, stdout) => {
    			if (error)
    				return reject(error);
          try {
            const outputObj = JSON.parse(stdout);
            return resolve( outputObj );
          } catch(ex) {
              self.logger.error("API.curl error %s", ex);
              return reject(ex);
          }
        };
        cp.execFile('curl', args, opts, cb)
    			.on('error', reject);
    	});
    }//curl

    /**
       * Download and save file to path
       * @param encoding File mimetype - defaults to 'binary'
       * @param uri String file url
       * @param string Destination path
       * @param done Success block callback
       * @param fail Failure block callback
       * @warn this implementation does not follow redirect
       */
      API.prototype.Download = function(uri, headers, params, path, encoding, done, fail) {
        var self=this;
        
        encoding = encoding || 'binary';

        if(params) {
          var queryString=qs.stringify(params);
          if( queryString ) {
            uri+="?"+queryString;
          }
        }
        
        var options = {
          headers : headers,
          hostname: this.host,
          path: uri,
          method: 'GET'
        };

        if(this.port && this.port!='80') { // port only if ! 80
          options['port']=this.port;
        }
        if(self.debug) {
          console.log("API.Download path:", uri);
          console.log( "API.Download headers", headers );
          console.log( "API.Download querystring:\n", params );
        }
        var request = this.http.get(options, function(res) {
            var imagedata = ''
            res.setEncoding( encoding )
            res.on('data', function(chunk){
              imagedata += chunk
            })
            res.on('end', function(){
                console.log(res)
                fs.writeFile(path, imagedata, 'binary', function(err){
                    if (err) return fail(err);
                    if(done) return done(path);
                })
            })
            request.on('error', function (e) {
              // General error, i.e.
              //  - ECONNRESET - server closed the socket unexpectedly
              //  - ECONNREFUSED - server did not listen
              //  - HPE_INVALID_VERSION
              //  - HPE_INVALID_STATUS
              //  - ... (other HPE_* codes) - server returned garbage
              return fail(e);
            });
            request.on('timeout', function () {
              // Timeout happend. Server received request, but not handled it
              // (i.e. doesn't send any response or it took to long).
              // You don't know what happend.
              // It will emit 'error' message as well (with ECONNRESET code).
              req.abort();
              return fail( new Error('request timed out') );
            });
        });
        self.requestUrl = (this.ssl?'https':'http') + '://' + request._headers['host'] + request.path;
        if(self.debug) {
          console.log("API.Download",self.requestUrl);
        }
        request.end();
      } //Download

    return API;

  })();

  module.exports = API

}).call(this);
