var path = require('path')
var logging = require(path.join(__dirname, 'logging'));
var trace = require(path.join(__dirname, 'model', 'trace'));
var transaction = require(path.join(__dirname, 'model', 'transaction'));

var LOG = new logging.Logger(path.basename(module.filename));

var Collector = function Collector() {
    if (arguments.callee._singletonInstance)
        return arguments.callee._singletonInstance;
    
    arguments.callee._singletonInstance = this;
    
    this.transaction = null;
    this.transactions = [];
};

Collector.prototype.beginTransaction = function(name) {
    this.setTransaction(new transaction.Transaction());
    var tr = new trace.Trace(name);
    this.transaction.enterTrace(tr);
    tr.start();
    return tr;
}

Collector.prototype.beginTrace = function(name) {
    var tr = new trace.Trace(name);
    this.enterTrace(tr);
    tr.start();
    return tr;
}

Collector.prototype.enterTrace = function(tr) {
    this.transaction.enterTrace(tr);
}

Collector.prototype.endTrace = function(tr) {
    tr.end();
    this.exitTrace(tr);
}

Collector.prototype.exitTrace = function(tr) {
    this.transaction.exitTrace(tr);
    if (this.transaction.isFinished()) {
        LOG.debug('Transaction finished: %s', JSON.stringify(this.transaction));
        this.transactions.push(this.transaction);
        this.transaction = null;
    } else if (this.transaction.isComplete()) {
        this.transaction = null;
    }
}

Collector.prototype.setTransaction = function(t) {
    if (this.transaction != null)
        throw new Error('Attempt to replace unfinished transaction');
    this.transaction = t;
}

Collector.prototype.getTransaction = function() {
    return this.transaction;
}

function getCollector() {
    return new Collector();
}

module.exports.Collector = Collector;
module.exports.getCollector = getCollector;
