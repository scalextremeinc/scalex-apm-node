var util = require('util');

var DEBUG = 0;
var INFO = 1;
var WARN = 2;
var ERROR = 3;
var LEVEL_STR = ['DEBUG', 'INFO ', 'WARN ', 'ERROR'];

var CONFIG = {
    level: DEBUG,
    stream: process.stdout
};

var Logger = function Logger(name) {
    this.name = name;
};

// 2013-08-26 11:36:59,458
function formatDate(d) {
    return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() + ' '
        + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '.' + d.getMilliseconds();
}

Logger.prototype.log = function(level, args) {
    if (level >= CONFIG.level) {
        var ts = formatDate(new Date());
        var msg = args[0];
        if (args.length > 1)
            msg = util.format.apply(null, args);
        CONFIG.stream.write('[SX] - ' + LEVEL_STR[level]
            + ' - ' + ts + ' - ' + this.name + ' - ' + msg + '\n');
    }
}

Logger.prototype.debug = function(msg) {
    this.log(DEBUG, arguments);
}

Logger.prototype.info = function(msg) {
    this.log(INFO, arguments);
}

Logger.prototype.warn = function(msg) {
    this.log(WARN, arguments);
}

Logger.prototype.error = function(msg) {
    this.log(ERROR, arguments);
}

module.exports.DEBUG = DEBUG;
module.exports.INFO = INFO;
module.exports.WARN = WARN;
module.exports.ERROR = ERROR;
module.exports.LEVEL_STR = LEVEL_STR;
module.exports.CONFIG = CONFIG;
module.exports.Logger = Logger;
