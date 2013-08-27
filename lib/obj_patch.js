var path = require('path')
var logging = require(path.join(__dirname, 'logging'));

var LOG = new logging.Logger(path.basename(module.filename));

var WRAPPED = [];

function add(obj, objName, funcName, wrapperFactory) {
    var func = obj[funcName];
    
    if (func._scalex_func) {
        LOG.error("Function is already patched: %s.%s", objName, funcName);
        return;
    }

    var wrapper = wrapperFactory(func, objName, funcName);
    wrapper._scalex_obj_name = objName;
    wrapper._scalex_obj = module;
    wrapper._scalex_func_name = funcName;
    wrapper._scalex_func = func;

    obj[funcName] = wrapper;
    
    WRAPPED.push(wrapper);
    
    LOG.debug("Patched function: %s.%s", objName, funcName);
}

function enable(wrapper) {
    wrapper._scalex_obj[wrapper._scalex_func_name] = wrapper;
    LOG.debug("Enabled wrapper: %s.%s", wrapper._scalex_moduleName, wrapper._scalex_func_name);
}

function disable(wrapper) {
    wrapper._scalex_obj[wrapper._scalex_func_name] = wrapper._scalex_func;
    LOG.debug("Disabled wrapper: %s.%s", wrapper._scalex_moduleName, wrapper._scalex_func_name);
}

function enableAll() {
    WRAPPERS.forEach(function (wrapper) {
        disable(wrapper);
    });
}

function disableAll() {
    WRAPPERS.forEach(function (wrapper) {
        disable(wrapper);
    });
}

module.exports.add = add;
module.exports.enable = enable;
module.exports.disable = disable;
module.exports.enableAll = enableAll;
module.exports.disableAll = disableAll;
