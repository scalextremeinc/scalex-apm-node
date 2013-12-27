var path = require('path');
var cls = require('continuation-local-storage');
var lib_dir = __dirname;

var logging = require(path.join(lib_dir, 'logging'));
var trace = require(path.join(lib_dir, 'model', 'trace'));
var transaction_module = require(path.join(lib_dir, 'model', 'transaction'));

var LOG = new logging.Logger(path.basename(module.filename));

var NAMESPACE = process.namespaces["COLLECTOR_STORAGE"];
if (!NAMESPACE)
    NAMESPACE = cls.createNamespace("COLLECTOR_STORAGE");

// singleton
var Collector = function Collector() {
    if (arguments.callee._singletonInstance)
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;

    this.transactions = [];
    LOG.debug('Instantiated collector')
};

Collector.prototype.beginTransaction = function(name, traceName) {
    var transaction = this.getTransaction();
    if (!transaction) {
        transaction = new transaction_module.Transaction(name, traceName);
        var self = this;
        transaction.once('finished', function (transaction) {
            self.transactions.push(transaction);
            LOG.debug("Transaction finished: %s", JSON.stringify(transaction));
            //NAMESPACE.set("transaction", null);
        });
        this.enterTransaction(transaction);
        transaction.start();
        LOG.debug("Transaction begin: %s/%s", name, traceName);
        return transaction;
    }
}

Collector.prototype.enterTransaction = function(t) {
    LOG.debug("Entering transaction: %s", t._id);
    var prev_transaction = NAMESPACE.get("transaction");
    if (prev_transaction != null && t !== prev_transaction)
        //throw new Error('Attempt to enter transaction while unfinished exists');
        LOG.debug("Replacing transaction: %s", prev_transaction._id);
    NAMESPACE.set("transaction", t);
}

Collector.prototype.exitTransaction = function(t) {
    var prev_transaction = NAMESPACE.get("transaction");
    if (prev_transaction != null && t !== prev_transaction)
        throw new Error('Attempt to exit wrong transaction');
    NAMESPACE.set("transaction", null);
}

Collector.prototype.getTransaction = function() {
    return NAMESPACE.get("transaction");
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
module.exports.NAMESPACE = NAMESPACE;
