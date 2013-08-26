var path = require('path')
var logging = require(path.join(__dirname, 'lib', 'logging'));
var wrapping = require(path.join(__dirname, 'lib', 'wrapping'));
var wrapper_module = require(path.join(__dirname, 'lib', 'wrapper', 'module'));

var LOG = new logging.Logger(path.basename(module.filename));
//logging.CONFIG.level = logging.INFO;

LOG.info("Initializing Scalextreme APM plugin...");


wrapping.wrap(require('module'), 'module', '_load', wrapper_module._loadWrapperFactory);
