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

Logger.prototype.log = function(level, msg, args) {
    if (level >= CONFIG.level) {
        var ts = formatDate(new Date());
        if (undefined != args)
            msg = util.format(msg, args);
        CONFIG.stream.write('[scalex] - ' + LEVEL_STR[level]
            + ' - ' + ts + ' - ' + this.name + ' - ' + msg + '\n');
    }
}

Logger.prototype.debug = function(msg, args) {
    this.log(DEBUG, msg, args);
}

Logger.prototype.info = function(msg, args) {
    this.log(INFO, msg, args);
}

Logger.prototype.warn = function(msg, args) {
    this.log(WARN, msg, args);
}

Logger.prototype.error = function(msg, args) {
    this.log(ERROR, msg, args);
}

module.exports.DEBUG = DEBUG;
module.exports.INFO = INFO;
module.exports.WARN = WARN;
module.exports.ERROR = ERROR;
module.exports.LEVEL_STR = LEVEL_STR;
module.exports.CONFIG = CONFIG;
module.exports.Logger = Logger;
