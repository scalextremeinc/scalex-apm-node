var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));

var LOG = new logging.Logger(path.basename(module.filename));

var Trace = function Trace(name) {
    this.name = name;
    this.async = false;
    this.startTime = null;
    this.endTime = null;
    this.duration = null;
    this.traces = [];
}

Trace.prototype.start = function() {
    this.startTime = Date.now();
}

Trace.prototype.end = function() {
    this.endTime = Date.now();
    this.duration = this.endTime - this.startTime;
}

Trace.prototype.setAsync = function (async) {
    this.async = async;
}

Trace.prototype.setArgs = function (args) {
    var arg, typ;
    args_str = [];
    for (var i = 0; i < args.length; i++) {
        arg = args[i];
        typ = typeof arg;
        if ("function" == typ|| "object" == typ)
            arg = typ;
        else
            arg = String(arg);
        args_str.push(arg);
    }

    this.args = args_str;
}

module.exports.Trace = Trace;
