var path = require('path')
var logging = require(path.join(__dirname, '..', 'logging'));
var trace = require(path.join(__dirname, 'trace'));

var LOG = new logging.Logger(path.basename(module.filename));

var id = 0;

var Transaction = function Transaction(nested) {
    this._id = id++;
    this.nested = nested || false;
    this.stack = [];
    this.traces = [];
    this.finished = false;
}

Transaction.prototype.beginTrace = function(name) {
    var tr = new trace.Trace(name);
    var current = this.stack[this.stack.length - 1]
    if (current) {
        current.traces.push(tr);
    } else {
        this.traces.push(tr);
    }
    this.stack.push(tr);
    tr.start();
    return tr;
}

Transaction.prototype.endTrace = function() {
    var tr = this.stack.pop();
    tr.end();
    if (this.stack.length == 0)
        this.finished = true;
}

module.exports.Transaction = Transaction;
