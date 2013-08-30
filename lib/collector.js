var path = require('path');
var lib_dir = __dirname;

var logging = require(path.join(lib_dir, 'logging'));
var trace = require(path.join(lib_dir, 'model', 'trace'));
var transaction = require(path.join(lib_dir, 'model', 'transaction'));

var LOG = new logging.Logger(path.basename(module.filename));

var Collector = function Collector() {
    if (arguments.callee._singletonInstance)
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;
    
    this.transaction = null;
    this.transactions = [];
};

Collector.prototype.beginTransaction = function(name) {
    this.enterTransaction(new transaction.Transaction(name));
    return this.transaction;
}

Collector.prototype.endTransaction = function(t) {
    if (t !== this.transaction)
        throw new Error('Attempt to end wrong transaction');
    this.transaction.end();
    if (this.transaction.isFinished()) {
        this.transactions.push(this.transaction);
        this.transaction = null;
        LOG.debug("Transaction finished: %s", JSON.stringify(t));
    }
}

Collector.prototype.beginTrace = function(name) {
    var tr = new trace.Trace(name);
    this.transaction.addTrace(tr);
    this.transaction.enterTrace(tr);
    this.transaction.startTrace(tr);
    return tr;
}

Collector.prototype.endTrace = function(tr) {
    this.transaction.endTrace(tr);
    this.transaction.exitTrace(tr);
}

Collector.prototype.enterTrace = function(tr) {
    this.transaction.enterTrace(tr);
}

Collector.prototype.exitTrace = function(tr) {
    this.transaction.exitTrace(tr);
}

Collector.prototype.enterTransaction = function(t) {
    if (this.transaction != null && t !== this.transaction)
        throw new Error('Attempt to enter transaction while unfinished exists');
    this.transaction = t;
}

Collector.prototype.exitTransaction = function(t) {
    if (this.transaction != null && t !== this.transaction)
        throw new Error('Attempt to exit wrong transaction');
    this.transaction = null;
}

Collector.prototype.getTransaction = function() {
    return this.transaction;
}

function getCollector() {
    return new Collector();
}

module.exports.Collector = Collector;
module.exports.getCollector = getCollector;
