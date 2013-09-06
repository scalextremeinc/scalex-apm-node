var path = require('path');
var lib_dir = __dirname;

var logging = require(path.join(lib_dir, 'logging'));

var LOG = new logging.Logger(path.basename(module.filename));

// singleton
var Uploader = function Uploader(collector) {
    if (arguments.callee._singletonInstance)
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;
    
    this.collector = collector;
    this.intervalId = null;
    LOG.debug('Instantiated uploader')
};

Uploader.prototype.start = function() {
    LOG.debug('Starting uploader')
    this.intervalId = setInterval(this.upload.bind(this), 60000);
}

Uploader.prototype.upload = function() {
    var transactions = this.collector.removeTransactions();
    LOG.debug('Uploading transactions, count: %s', transactions.length);
}

module.exports.Uploader = Uploader;