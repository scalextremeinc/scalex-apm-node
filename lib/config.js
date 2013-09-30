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
};

module.exports.Config = Config;