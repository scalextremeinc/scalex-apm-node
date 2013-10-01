var path = require('path');
var http = require('http');
var url = require('url');
var os = require('os');
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
    this.conn = CONFIG.url == null ? null : url.parse(CONFIG.url);
    this.host = CONFIG.host || os.hostname();
    this.upload_interval = CONFIG.upload_interval || 60000;
    LOG.debug('Instantiated uploader')
};

Uploader.prototype.start = function() {
    LOG.debug('Starting uploader')
    this.intervalId = setInterval(this.upload.bind(this), this.upload_interval);
}

Uploader.prototype.upload = function() {
    var transactions = this.collector.removeTransactions();
    
    if (transactions.length == 0)
        return;
    
    if (!CONFIG.customer || !CONFIG.app || !CONFIG.url) {
        LOG.warn("Incomplete configuration won't upload");
        return;
    }
    
    LOG.debug('Uploading transactions, url: %s, customer: %s, app: %s, host: %s, count: %s',
        CONFIG.url, CONFIG.customer, CONFIG.app, this.host, transactions.length);

    try {
    
        var msg = JSON.stringify(
            {
                customer: CONFIG.customer,
                app: CONFIG.app,
                host: this.host,
                transactions: transactions
            },
            function censor(key, value) {
                if (key[0] == "_" || "domain" == key) {
                    return undefined;
                }
                return value;
            }
        );
        
        var options = {
            host: this.conn.hostname,
            port: this.conn.port,
            path: this.conn.path,
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
    
    } catch (e) {
        LOG.error("Transactions upload failed, error: %s", e);
    }
        
}

module.exports.Uploader = Uploader;
