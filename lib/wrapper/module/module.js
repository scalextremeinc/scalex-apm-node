var path = require('path')
var logging = require(path.join(__dirname, '..', '..', 'logging'));
var obj_patch = require(path.join(__dirname, '..', '..', 'obj_patch'));
var common = require(path.join(__dirname, '..', 'common'));

var LOG = new logging.Logger(path.basename(module.filename));

function _load(func, moduleName, funcName) {
    return function (name) {
        LOG.debug("Module load wrapper, loading: %s", name);
        var module = func.apply(this, arguments);
        
        if (module) {
            for(var key in module) {
                if ('_load' != key && typeof(module[key]) == "function") {
                    obj_patch.add(module, name, key, common.dummyWrapper);
                }
            }
        }
       
        return module;
    };
}

module.exports._load = _load
