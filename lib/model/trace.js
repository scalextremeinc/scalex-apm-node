var path = require('path')
var logging = require(path.join(__dirname, '..', 'logging'));

var LOG = new logging.Logger(path.basename(module.filename));

var Trace = function Trace(name) {
    this.name = name;
    this.async = false;
    this.startTime = null;
    this.endTime = null;
    this.duration = null;
    this.traces = [];
    this.exceptions = [];
}

Trace.prototype.start = function() {
    this.startTime = Date.now();
}

Trace.prototype.end = function() {
    this.endTime = Date.now();
    this.duration = this.endTime - this.startTime;
}

Trace.prototype.addException = function (e) {
    this.exceptions.push(e);
}

Trace.prototype.setAsync = function (async) {
    this.async = async;
}

module.exports.Trace = Trace;
