var path = require('path')
var logging = require(path.join(__dirname, '..', 'logging'));
var wrapping = require(path.join(__dirname, '..', 'wrapping'));


var LOG = new logging.Logger(path.basename(module.filename));

function commonWrapperFactory(orig) {
    return function () {
        LOG.debug("Start: %s", orig);
        var ret = orig.apply(this, arguments);
        LOG.debug("End: %s", orig);
        return ret;
    }
}

function _loadWrapperFactory(_loadOrig) {
    return function (moduleName) {
        LOG.debug("Module load wrapper, loading: %s", moduleName);
        var module = _loadOrig.apply(this, arguments);
        
        if (module) {
            for(var key in module) {
                if ('_load' != key && typeof(module[key]) == "function") {
                    wrapping.wrap(module, moduleName, key, commonWrapperFactory);
                }
            }
        }
       
        return module;
    };
}

module.exports._loadWrapperFactory = _loadWrapperFactory;
