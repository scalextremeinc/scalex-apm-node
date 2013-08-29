var path = require('path')
var logging = require(path.join(__dirname, '..', 'logging'));
var trace = require(path.join(__dirname, 'trace'));

var LOG = new logging.Logger(path.basename(module.filename));

var id = 0;

var Transaction = function Transaction() {
    this._id = id++;
    this.stack = [];
    this.async_pending = 0;
    this.traces = [];
    this.finished = false;
}

Transaction.prototype.enterTrace = function(tr) {
    var current = this.stack[this.stack.length - 1]
    if (current) {
        current.traces.push(tr);
    } else {
        this.traces.push(tr);
    }
    this.stack.push(tr);
}

Transaction.prototype.exitTrace = function(tr) {
    if (tr !== this.stack.pop())
        throw new Error("Attempt to exit trace different than top one");
    if (this.stack.length == 0 && this.async_pending == 0)
        this.finished = true;
}

Transaction.prototype.enterTraceAsync = function(tr) {
    this.async_pending--;
    this.stack.push(tr);
}

Transaction.prototype.exitTraceAsync = function(tr) {
    this.async_pending++;
    this.exitTrace(tr);
}

Transaction.prototype.isFinished = function() {
    return this.finished;
}

Transaction.prototype.isComplete = function() {
    return this.stack.length == 0;
}

module.exports.Transaction = Transaction;
