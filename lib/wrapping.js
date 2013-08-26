var path = require('path')
var logging = require(path.join(__dirname, 'logging'));

var LOG = new logging.Logger(path.basename(module.filename));

var WRAPPED = [];

function wrap(module, moduleName, funcName, wrapperFactory) {
    //var module = require(moduleName);
    var funcOrig = module[funcName];
    
    if (funcOrig._scalex_funcOrig) {
        LOG.error("Function is already wrapped: %s.%s", moduleName, funcName);
        return;
    }

    var wrapper = wrapperFactory(funcOrig, moduleName, funcName);
    wrapper._scalex_moduleName = moduleName;
    wrapper._scalex_module = module;
    wrapper._scalex_funcName = funcName;
    wrapper._scalex_funcOrig = funcOrig;

    module[funcName] = wrapper;
    
    WRAPPED.push(wrapper);
    
    LOG.debug("Wrapped function: %s.%s", moduleName, funcName);
}

function enable(wrapper) {
    wrapper._scalex_module[wrapper._scalex_funcName] = wrapper;
    LOG.debug("Enabled wrapper: %s.%s", wrapper._scalex_moduleName, wrapper._scalex_funcName);
}

function disable(wrapper) {
    wrapper._scalex_module[wrapper._scalex_funcName] = wrapper._scalex_funcOrig;
    LOG.debug("Disabled wrapper: %s.%s", wrapper._scalex_moduleName, wrapper._scalex_funcName);
}

function drop(wrapper) {
    var i = WRAPPERS.indexOf(wrapper);
    WRAPPERS.splice(i, 1);
    disable(wrapper);
}

function dropAll() {
    WRAPPERS.forEach(function (wrapper) {
        disable(wrapper);
    });
    WRAPPERS = [];
}

module.exports.wrap = wrap;
module.exports.enable = enable;
module.exports.disable = disable;
module.exports.drop = drop;
module.exports.dropAll = dropAll;
