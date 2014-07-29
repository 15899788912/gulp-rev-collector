'use strict';
var _           = require('underscore');
var gutil       = require('gulp-util');
var PluginError = gutil.PluginError;
var through     = require('through2');
var path        = require('path');

var PLUGIN_NAME = 'gulp-rev-collector';

function _getManifestData(file) {
    var data;
    var ext = path.extname(file.path);
    if (ext === '.json') {
        var json = {};
        try {
            json = JSON.parse(file.contents.toString('utf8'))
        } catch (x) {
            this.emit('error', new PluginError(PLUGIN_NAME,  x));
            return;
        }
        if (_.isObject(json)) {
            var isRev = 1;
            Object.keys(json).forEach(function (key) {
                if ( path.basename(json[key]).replace(/-[0-9a-f]{8}-?/, '' ) !==  path.basename(key) ) {
                    isRev = 0;
                }
            });
            
            if (isRev) {
                data = json;
            }
        }
        
    }
    return data;
}

function revCollector() {
    var manifest  = {};
    var mutables = [];
    return through.obj(function (file, enc, cb) {
        if (!file.isNull()) {
            var mData = _getManifestData(file);
            if (mData) {
                _.extend( manifest, mData );
            } else {
                mutables.push(file);
            }
        }
        cb();
    }, function (cb) {
        var changes = [];
        for (var k in manifest) {
            changes.push({
                regexp: new RegExp( k.replace(/[\-\[\]\{\}\(\)\*\+\?\.\^\$\|]/g, "\\$&"), 'g' ),
                replacement: manifest[k]
            });
        }

        mutables.forEach(function (file){
            if (!file.isNull()) {
                var src = file.contents.toString('utf8');
                changes.forEach(function (r) {
                    src = src.replace(r.regexp, r.replacement);
                });
                file.contents = new Buffer(src);
            }
            this.push(file);
        }, this);
        
        cb();
    });
}

module.exports = revCollector;
