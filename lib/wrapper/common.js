var path = require('path')
var logging = require(path.join(__dirname, '..', 'logging'));

var LOG = new logging.Logger(path.basename(module.filename));

function dummyWrapper(func, objName, funcName) {
    return function () {
        LOG.debug("Start: %s.%s", objName, funcName);
        var ret = func.apply(this, arguments);
        LOG.debug("End: %s.%s", objName, funcName);
        return ret;
    }
}

module.exports.dummyWrapper = dummyWrapper
