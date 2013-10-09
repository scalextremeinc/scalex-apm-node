var path = require('path');
var lib_dir = __dirname;

var logging = require(path.join(lib_dir, 'logging'));

var LOG = new logging.Logger(path.basename(module.filename));


var Config = function Config() {
    if (arguments.callee._singletonInstance)
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;

    // initialize config
    this.url = process.env.SCALEX_COLLECTOR_URL;
    this.customer = process.env.SCALEX_CUSTOMER;
    this.app = process.env.SCALEX_APP;
    this.host = process.env.SCALEX_HOST;
    this.upload_interval = process.env.SCALEX_UPLOAD_INTERVAL;
    this.log_level = process.env.SCALEX_APM_LOG_LEVEL || 'INFO';
};

module.exports.Config = Config;
