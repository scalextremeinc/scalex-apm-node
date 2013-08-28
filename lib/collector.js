var path = require('path')
var logging = require(path.join(__dirname, 'logging'));
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
    this.transaction = new transaction.Transaction();
    return this.transaction.beginTrace(name);
}

Collector.prototype.beginTrace = function(name) {
    return this.transaction.beginTrace(name);
}

Collector.prototype.endTrace = function() {
    this.transaction.endTrace();
    if (this.transaction.finished) {
        LOG.debug('Transaction finished: %s', JSON.stringify(this.transaction));
        if (!this.transaction.nested)
            this.transactions.push(this.transaction);
        this.transaction = null;
    }
}

Collector.prototype.setTransaction = function(t) {
    if (this.transaction != null)
        throw new Error('Attempt to replace unfinished transaction');
    this.transaction = t;
}

Collector.prototype.createNestedTransaction = function() {
    return new transaction.Transaction(true);
}

function getCollector() {
    return new Collector();
}

module.exports.Collector = Collector;
module.exports.getCollector = getCollector;
