var path = require('path')
var logging = require(path.join(__dirname, 'lib', 'logging'));

var LOG = new logging.Logger(path.basename(module.filename));
//logging.CONFIG.level = logging.INFO;

LOG.info("Initializing Scalextreme APM plugin...");

LOG.debug("Debug log: %s", 1);
LOG.info("Info log: %s", 2);
LOG.warn("Warn log: %s", 3);
LOG.error("Error log: %s", 4);
