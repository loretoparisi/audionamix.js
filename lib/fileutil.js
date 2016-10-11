/**
* Node.js utils
* @author Loreto Parisi (loretoparisi at gmail dot com)
* @2015-2016 Loreto Parisi 
*/
(function() {

var fs = require('fs');
var path = require('path');

/**
 * File Utilities
 * @author Loreto Parisi (loretoparisi at gmail dot com)
*/
var FileUtil = {

    /**
     * Get temporary folder path
     * Supported platforms: Windows, Linux, MacOS
     */
    GetTempDir : function() {
        var path;

        var isWindows = process.platform === 'win32';
        var trailingSlashRe = isWindows ? /[^:]\\$/ : /.\/$/;
        
        if (isWindows) {
            path = process.env.TEMP ||
                process.env.TMP ||
                (process.env.SystemRoot || process.env.windir) + '\\temp';
        } else {
            path = process.env.TMPDIR ||
                process.env.TMP ||
                process.env.TEMP ||
                '/tmp';
        }

        if (trailingSlashRe.test(path)) {
            path = path.slice(0, -1);
        }

        return path;
    },//GetTempDir

    /**
    * Get node script current directory
    * @param name true to cut the path
    * @note:
        other way:
        var config_dir  = path.dirname(module.filename) + (path.sep || path.delimiter || "\\" );
    */
    getFileDir : function(filename) {
        var chunks = this.arraySplit(filename,path.sep);
        chunks = chunks.splice(0,chunks.length-1);
        var cwd = path.sep + chunks.join(path.sep);
        return cwd;
    },//getFileDir

    /**
     * Get node script current directory
     * @param name true to cut the path
     */
    getCurrentDir : function(name) {
        if(typeof(__dirname)=='undefined') return '';
        var fullPath = __dirname;
        if(!name) return fullPath;
        var path = fullPath.split(path.separator);
        var cwd = path[path.length-1];
        return cwd;
    },//getCurrentDir

    /**
     * Check file existance
     */
    checkFile : function(fname,done) {
        fname=fname||'';
        fs.exists(fname,function(exists){
            if(done) done(exists);
        });
    },//checkFile

    /**
     * delete file
     */
    deleteFile : function(fname,done) {
        fname=fname||'';
        fs.unlink(fname,function(error) {
            if(!error) {
                console.log('deleted file %s', fname);
            }
        });
    },//deleteFile

    /**
     * Write a file atomically
    */
    writeToFile : function(fname,fcontents,done) {
        fs.writeFile(fname, fcontents, function(err) {
            if(err) {
                console.log('Error writing file %s', fname, err);
                if(done) return done(err);
            }
            //console.log("The file %s was saved!", fname);
            if(done) return done();
        });
    },//prettifyJson

    /**
     * Write a file atomically sync
    */
    writeToFileSync : function(fname,fcontents,encoding) {
        var self=this;
        encoding = encoding || 'utf8';
        try {
            fs.writeFileSync(fname,fcontents,encoding);
            console.log("The file %s was saved!", fname);
        } catch(ex) {
            console.log('Error writing file %s', fname);
        }
    }, //writeFileSync

    /**
     * Read file contents sync
     * @param json bool Parse as json
     * @param fix true to delete when file is broken
     */
    readFileSync : function(fname, json, fix, encoding) {
        var self=this;
        encoding = encoding || 'utf8';
        json = json || false;
        fix = fix || false;
        var exists = self.checkFileSync(fname);
        if(exists) {
            var data=fs.readFileSync(fname, encoding);
            try {
                if(json) data = JSON.parse(data);
                return data;
            } catch(ex) {
                console.log('Error readFileSync %s error:%s', fname, ex);
                if(fix) self.deleteFile(fname);
                return null;
            }
        }
        return null;
    },//readFileSync

    /**
     * Check file existance sync
     */
    checkFileSync : function(fname) {
        fname=fname||'';
        var exists = fs.existsSync(fname);
        return exists;
    },//checkFileSync

    /**
     * Read file contents
     * @param json bool Parse as json
     * @param fix true to delete when file is broken
     */
    readFile: function(fname, done, json, fix) {
        var self=this;
        json=json||false;
        fix=fix||false;
        self.checkFile(fname,function(exists) {
            if(exists) { // file exists
                fs.readFile(fname, 'utf8', function (err, data) {
                    if (err) {
                        console.log('Error reading file %s error:%s', fname,err);
                        if(done) done();
                        return;
                    }
                    try {
                        if(json) data = JSON.parse(data);
                        if(done) done(data);
                    } catch(ex) {
                    console.log('Error readFile: parsing file %s error:%s', fname, ex);
                        if(fix) self.deleteFile(fname);
                        if(done) done();
                    }
                });
            }
            else { // no file
                if(done) done();
            }
        });
    }//readFile

}//FileUtil

module.exports = FileUtil;

}).call(this);
