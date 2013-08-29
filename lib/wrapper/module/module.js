var path = require('path')
var logging = require(path.join(__dirname, '..', '..', 'logging'));
var obj_patch = require(path.join(__dirname, '..', '..', 'obj_patch'));
var wrapper = require(path.join(__dirname, '..', 'wrapper'));

var LOG = new logging.Logger(path.basename(module.filename));

function _load(func, name, skip) {
    return function (moduleName) {
        var module = func.apply(this, arguments);
        if (module) {
            
            LOG.debug("Module load wrapper, patching: %s", moduleName);
            
            if ('express' == moduleName) {
                obj_patch.add(module.response, 'express.response', 'render', wrapper.callWrapper);
            }
            
            /*
            for(var key in module) {
                if ('_load' != key && typeof(module[key]) == "function") {
                    obj_patch.add(module, moduleName, key, wrapper.callWrapper);
                }
            }
            */
        }
       
        return module;
    };
}

module.exports._load = _load
