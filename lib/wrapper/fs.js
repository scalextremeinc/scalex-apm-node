var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));
var collector = require(path.join(lib_dir, 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();


function patch(fs) {
    //obj_patch.add(fs, 'fs', 'openSync', wrapper.callWrapper);
    //obj_patch.add(fs, 'fs', 'readSync', wrapper.callWrapper);
    //obj_patch.add(fs, 'fs', 'writeSync', wrapper.callWrapper);
    obj_patch.add(fs, 'fs', 'readFileSync', wrapper.callWrapper);
    obj_patch.add(fs, 'fs', 'writeFileSync', wrapper.callWrapper);
    obj_patch.add(fs, 'fs', 'appendFileSync', wrapper.callWrapper);
    obj_patch.add(fs, 'fs', 'renameSync', wrapper.callWrapper);
    obj_patch.add(fs, 'fs', 'mkdirSync', wrapper.callWrapper);
    obj_patch.add(fs, 'fs', 'readdirSync', wrapper.callWrapper);
    
    //obj_patch.add(fs, 'fs', 'open', wrapper.callWithCallbackWrapper);
    //obj_patch.add(fs, 'fs', 'read', wrapper.callWithCallbackWrapper);
    //obj_patch.add(fs, 'fs', 'write', wrapper.callWithCallbackWrapper);
    obj_patch.add(fs, 'fs', 'readFile', wrapper.callWithCallbackWrapper);
    obj_patch.add(fs, 'fs', 'writeFile', wrapper.callWithCallbackWrapper);
    obj_patch.add(fs, 'fs', 'appendFile', wrapper.callWithCallbackWrapper);
    obj_patch.add(fs, 'fs', 'rename', wrapper.callWithCallbackWrapper);
    obj_patch.add(fs, 'fs', 'mkdir', wrapper.callWithCallbackWrapper);
    obj_patch.add(fs, 'fs', 'readdir', wrapper.callWithCallbackWrapper);
    
}

module.exports.patch = patch
