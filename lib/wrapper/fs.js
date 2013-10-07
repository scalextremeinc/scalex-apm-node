var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));
var collector = require(path.join(lib_dir, 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();


function asyncAction(func, name) {
    return function () {
        var t = COLLECTOR.getTransaction();
        if (!t)
            return func.apply(this, arguments);
        
        LOG.debug("Wrapped call: %s", name);
        var ret, tr, error;
        var args = Array.prototype.slice.call(arguments, 0);
        
        tr = t.beginTrace(name);
        
        // wrap callback param (last param)
        args[args.length - 1] = wrapper.callbackWrapper(args[args.length - 1], name, t, tr);
        
        try {
            ret = func.apply(this, args);
        } catch(e) { 
            t.addException(msg);
            error = e;
        } finally {
            t.exitTrace(tr);
        }
        if (error)
            throw error;
        
        return wrapper.callWrapper(ret, name + '.render');
    };
}

function patch(fs) {
    
    //obj_patch.add(fs, 'fs', 'openSync', wrapper.callWrapper);
    //obj_patch.add(fs, 'fs', 'readSync', wrapper.callWrapper);
    obj_patch.add(fs, 'fs', 'readFileSync', wrapper.callWrapper);
    //obj_patch.add(fs, 'fs', 'writeSync', wrapper.callWrapper);
    obj_patch.add(fs, 'fs', 'writeFileSync', wrapper.callWrapper);
    obj_patch.add(fs, 'fs', 'appendFileSync', wrapper.callWrapper);
    obj_patch.add(fs, 'fs', 'renameSync', wrapper.callWrapper);
    obj_patch.add(fs, 'fs', 'mkdirSync', wrapper.callWrapper);
    obj_patch.add(fs, 'fs', 'readdirSync', wrapper.callWrapper);
    
    //obj_patch.add(fs, 'fs', 'open', asyncAction);
    //obj_patch.add(fs, 'fs', 'read', asyncAction);
    obj_patch.add(fs, 'fs', 'readFile', asyncAction);
    //obj_patch.add(fs, 'fs', 'write', asyncAction);
    obj_patch.add(fs, 'fs', 'writeFile', asyncAction);
    obj_patch.add(fs, 'fs', 'appendFile', asyncAction);
    obj_patch.add(fs, 'fs', 'rename', asyncAction);
    obj_patch.add(fs, 'fs', 'mkdir', asyncAction);
    obj_patch.add(fs, 'fs', 'readdir', asyncAction);
    
}

module.exports.patch = patch
