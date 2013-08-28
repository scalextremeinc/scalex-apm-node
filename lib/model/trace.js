var path = require('path')
var logging = require(path.join(__dirname, '..', 'logging'));

var LOG = new logging.Logger(path.basename(module.filename));

var Trace = function Trace(name) {
    this.name = name;
    this.startTime = null;
    this.endTime = null;
    this.traces = [];
    this.exceptions = [];
    this.transactions = [];
}

Trace.prototype.start = function() {
    this.startTime = new Date().getTime();
}

Trace.prototype.end = function() {
    this.endTime = new Date().getTime();
}

Trace.prototype.addException = function (e) {
    this.exceptions.push(e);
}

Trace.prototype.addTransaction = function (t) {
    this.transactions.push(t);
}

module.exports.Trace = Trace;
