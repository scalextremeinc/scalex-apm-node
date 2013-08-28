var path = require('path')
var logging = require(path.join(__dirname, 'lib', 'logging'));
var obj_patch = require(path.join(__dirname, 'lib', 'obj_patch'));
var wrapper = require(path.join(__dirname, 'lib', 'wrapper', 'wrapper'));
var wrapper_module = require(path.join(__dirname, 'lib', 'wrapper', 'module', 'module'));
var wrapper_http = require(path.join(__dirname, 'lib', 'wrapper', 'module', 'http'));

var LOG = new logging.Logger(path.basename(module.filename));
//logging.CONFIG.level = logging.INFO;

LOG.info("Initializing Scalextreme APM plugin...");

obj_patch.add(require('http'), 'http', 'request', wrapper_http.request);
obj_patch.add(require('http'), 'http', 'createServer', wrapper_http.createServer);


obj_patch.add(require('module'), 'module', '_load', wrapper_module._load);
