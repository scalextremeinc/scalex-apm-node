var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));

var LOG = new logging.Logger(path.basename(module.filename));

function _load(func, name, skip) {
    var wrapper_dir = path.join(lib_dir, 'wrapper');
    return function (moduleName) {
        var module = func.apply(this, arguments);
        if (!module._scalex_patched && path.extname(moduleName) !== '.js') {
            try {
                var module_wrapper = require(path.join(wrapper_dir, moduleName + '.js'));
                try {
                    LOG.debug("Patching module: %s", moduleName);
                    module_wrapper.patch(module);
                    module._scalex_patched = true;
                } catch(e) {
                    LOG.error("Failed to patch: %s, error: %s", moduleName, e);
                }
            } catch(e) {
                // skip
            }
        }
       
        return module;
    };
}

module.exports._load = _load
