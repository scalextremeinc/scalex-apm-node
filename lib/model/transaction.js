var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var trace = require(path.join(lib_dir, 'model', 'trace'));

var LOG = new logging.Logger(path.basename(module.filename));

var id = 0;

var Transaction = function Transaction(name) {
    this._id = id++;
    this.name = name;
    this.stack = [];
    this.pendingTraces = 0;
    this.startTime = Date.now();;
    this.endTime = null;
    this.duration = null;
    this.traces = [];
    this.finished = false;
    this.start();
}

Transaction.prototype.start = function() {
    this.startTime = Date.now();
}

Transaction.prototype.end = function() {
    this.endTime = Date.now();
    this.duration = this.endTime - this.startTime;
    this.finished = true;
}

Transaction.prototype.addTrace = function(tr) {
    var current = this.stack[this.stack.length - 1]
    if (current) {
        current.traces.push(tr);
    } else {
        this.traces.push(tr);
    }
}

Transaction.prototype.startTrace = function(tr) {
    this.pendingTraces++;
    tr.start();
}

Transaction.prototype.endTrace = function(tr) {
    this.pendingTraces--;
    tr.end();
}

Transaction.prototype.enterTrace = function(tr) {
    this.stack.push(tr);
}

Transaction.prototype.exitTrace = function(tr) {
    if (tr !== this.stack.pop())
        throw new Error("Attempt to exit trace different than top one");
}

Transaction.prototype.isFinished = function() {
    return this.finished;
}

Transaction.prototype.isPending = function() {
    return this.stack.length != 0 || this.pendingTraces != 0;
}

module.exports.Transaction = Transaction;
