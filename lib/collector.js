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
    var t = new transaction.Transaction(name);
    var self = this;
    t.on('finished', function (t) {
        self.transactions.push(t);
        LOG.debug("Transaction finished: %s", JSON.stringify(t));
        self.transaction = null;
    });
    this.enterTransaction(t);
    this.transaction.start();
    return this.transaction;
}

Collector.prototype.endTransaction = function(t) {
    if (t !== this.transaction)
        throw new Error('Attempt to end wrong transaction');
    this.transaction.end();
    LOG.debug("Transaction end: %s", JSON.stringify(t));
}

Collector.prototype.beginTrace = function(name) {
    var tr = new trace.Trace(name);
    this.transaction.addTrace(tr);
    this.transaction.enterTrace(tr);
    this.transaction.startTrace(tr);
    return tr;
}

Collector.prototype.endTrace = function(tr) {
    this.transaction.exitTrace(tr);
    this.transaction.endTrace(tr);
}

Collector.prototype.enterTrace = function(tr) {
    this.transaction.enterTrace(tr);
}

Collector.prototype.exitTrace = function(tr) {
    this.transaction.exitTrace(tr);
}

Collector.prototype.enterTransaction = function(t) {
    if (this.transaction != null && t !== this.transaction)
        //throw new Error('Attempt to enter transaction while unfinished exists');
        LOG.debug("Entering new transaction: %s, previous exited: %s", t._id, this.transaction._id);
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
