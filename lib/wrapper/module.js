var path = require('path')
var logging = require(path.join(__dirname, '..', 'logging'));
var wrapping = require(path.join(__dirname, '..', 'wrapping'));


var LOG = new logging.Logger(path.basename(module.filename));

function commonWrapperFactory(funcOrig, moduleName, funcName) {
    return function () {
        LOG.debug("Start: %s.%s", moduleName, funcName);
        var ret = funcOrig.apply(this, arguments);
        LOG.debug("End: %s.%s", moduleName, funcName);
        return ret;
    }
}

function _loadWrapperFactory(funcOrig, moduleName, funcName) {
    return function (name) {
        LOG.debug("Module load wrapper, loading: %s", name);
        var module = funcOrig.apply(this, arguments);
        
        if (module) {
            for(var key in module) {
                if ('_load' != key && typeof(module[key]) == "function") {
                    wrapping.wrap(module, name, key, commonWrapperFactory);
                }
            }
        }
       
        return module;
    };
}

module.exports._loadWrapperFactory = _loadWrapperFactory;
