var path = require('path');
var lib_dir = __dirname;

var logging = require(path.join(lib_dir, 'logging'));
var trace = require(path.join(lib_dir, 'model', 'trace'));
var transaction_module = require(path.join(lib_dir, 'model', 'transaction'));

var LOG = new logging.Logger(path.basename(module.filename));

// singleton
var Collector = function Collector() {
    if (arguments.callee._singletonInstance)
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;
    
    this.transaction = null;
    this.transactions = [];
    LOG.debug('Instantiated collector')
};

Collector.prototype.beginTransaction = function(name, traceName) {
    var transaction = new transaction_module.Transaction(name, traceName);
    var self = this;
    transaction.on('finished', function (transaction) {
        self.transactions.push(transaction);
        LOG.debug("Transaction finished: %s", JSON.stringify(transaction));
        self.transaction = null;
    });
    this.enterTransaction(transaction);
    this.transaction.start();
    LOG.debug("Transaction begin: %s/%s", name, traceName);
    return this.transaction;
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

Collector.prototype.removeTransactions = function() {
    var ret = this.transactions;
    this.transactions = [];
    return ret;
}

function getCollector() {
    return new Collector();
}

module.exports.Collector = Collector;
module.exports.getCollector = getCollector;
