var path = require('path');
var http = require('http');
var lib_dir = __dirname;

var logging = require(path.join(lib_dir, 'logging'));
var config = require(path.join(lib_dir, 'config'));

var LOG = new logging.Logger(path.basename(module.filename));
var CONFIG = new config.Config();

var request = http.request._scalex_func || http.request;

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
    LOG.debug('Uploading transactions, url: %s, customer: %s, app: %s, count: %s',
        CONFIG.url, CONFIG.customer, CONFIG.app, transactions.length);
    
    var msg = JSON.stringify({
        customer: "test",
        app: "app1",
        transactions: transactions
    });
    
    var options = {
        host: 'scalex2',
        port: '1999',
        path: '/collector/transaction',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': msg.length
        }
    };

    // Set up the request
    var post_req = request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          console.log('Response: ' + chunk);
        });
    });

    // post the data
    post_req.write(msg);
    post_req.end();
        
}

module.exports.Uploader = Uploader;
