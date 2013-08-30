var path = require('path');
var util = require('util');
var events = require('events');

var lib_dir = path.join(__dirname, '..');
var logging = require(path.join(lib_dir, 'logging'));
var trace = require(path.join(lib_dir, 'model', 'trace'));

var LOG = new logging.Logger(path.basename(module.filename));

var id = 0;

var Transaction = function Transaction(name) {
    events.EventEmitter.call(this);
    this._id = id++;
    this._stack = [];
    this._pendingTraces = 0;
    this.name = name;
    this.trace = new trace.Trace(name);
    this.finished = false;
}
util.inherits(Transaction, events.EventEmitter);

Transaction.prototype.start = function() {
    this._pendingTraces++;
    this.trace.start();
}

Transaction.prototype._checkFinished = function() {
    if (this._pendingTraces == 0) {
        this.finished = true;
        this.emit('finished', this);
    }
}

Transaction.prototype.end = function() {
    this._pendingTraces--;
    this.trace.end();
    this._checkFinished();
}

Transaction.prototype.addTrace = function(tr) {
    var current = this._stack[this._stack.length - 1]
    if (current) {
        current.traces.push(tr);
    } else {
        this.trace.traces.push(tr);
    }
}

Transaction.prototype.startTrace = function(tr) {
    this._pendingTraces++;
    tr.start();
}

Transaction.prototype.endTrace = function(tr) {
    this._pendingTraces--;
    tr.end();
    this._checkFinished();
}

Transaction.prototype.enterTrace = function(tr) {
    this._stack.push(tr);
}

Transaction.prototype.exitTrace = function(tr) {
    var top = this._stack.pop();
    if (tr !== top) {
        LOG.error("Attempt to exit wrong trace, tr: %s, top: %s", tr.name, top.name);
        throw new Error("Attempt to exit wrong trace");
    }
}

Transaction.prototype.isFinished = function() {
    return this.finished;
}

module.exports.Transaction = Transaction;
