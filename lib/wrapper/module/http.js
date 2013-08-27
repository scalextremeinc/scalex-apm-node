var path = require('path')
var logging = require(path.join(__dirname, '..', '..', 'logging'));
var obj_patch = require(path.join(__dirname, '..', '..', 'obj_patch'));
var common = require(path.join(__dirname, '..', 'common'));

var LOG = new logging.Logger(path.basename(module.filename));

function createServer(func, moduleName, funcName) {
    return function (handler) {

        var ret = func(function (req, res) {
            var ret = handler(req, res);
            LOG.debug("Request handler called");
            return ret;
        });
        
        return ret;
    };
}

module.exports.createServer = createServer
