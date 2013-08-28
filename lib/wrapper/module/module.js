var path = require('path')
var logging = require(path.join(__dirname, '..', '..', 'logging'));
var obj_patch = require(path.join(__dirname, '..', '..', 'obj_patch'));
var common = require(path.join(__dirname, '..', 'common'));

var LOG = new logging.Logger(path.basename(module.filename));

function _load(func, name) {
    return function (moduleName) {
        LOG.debug("Module load wrapper, loading: %s", moduleName);
        var module = func.apply(this, arguments);
        
        if (module) {
            for(var key in module) {
                if ('_load' != key && typeof(module[key]) == "function") {
                    obj_patch.add(module, moduleName, key, common.callWrapper);
                }
            }
        }
       
        return module;
    };
}

module.exports._load = _load
