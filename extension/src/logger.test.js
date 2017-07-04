var Logger = require('./logger.js');

var logger = Logger.getInstance();
logger.log('a');

var logger2 = Logger.getInstance();
logger2.log('b');