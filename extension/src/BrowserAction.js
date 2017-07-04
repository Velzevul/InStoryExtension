var Logger = require('./Logger.js');

var ICON_IDLE         = '../images/icon.png';
var ICON_DISABLED     = '../images/icon-disabled.png';
var ICON_RECORDING_1  = '../images/icon-recording1.png';
var ICON_RECORDING_2  = '../images/icon-recording2.png';
var BLINK_SPEED = 500;

var BrowserAction = function(chrome) {
  'use strict';

  var _logger = Logger.getInstance();
  var _chrome = chrome;
  var _blinkInterval = null;
  var _blinkFrame = 1;

  return {
    startRecording: function() {
      _logger.log('start recording');
      _chrome.browserAction.setTitle({title: 'Recording image seeking history'});

      _blinkInterval = setTimeout(function() {
        if (_blinkFrame === 1) {
          _chrome.browserAction.setIcon({path: ICON_RECORDING_1});
          _blinkFrame = 2;
        } else if (_blinkFrame === 2) {
          _chrome.browserAction.setIcon({path: ICON_RECORDING_2});
          _blinkFrame = 1;
        }
      }, BLINK_SPEED);
    },
    goIdle: function() {
      _logger.log('going idle');
      _chrome.browserAction.setTitle({title: 'Click to start recording image seeking history'});
      _chrome.browserAction.setIcon({path: ICON_IDLE});
      clearTimeout(_blinkInterval);
      _blinkInterval = null;
      _blinkFrame = 1;
    },
    goDisabled: function() {
      _logger.log('going disabled');
      _chrome.browserAction.setTitle({title: 'Click to log into the service'});
      _chrome.browserAction.setIcon({path: ICON_DISABLED});
    },
    setClickHaldler: function() {

    },
    clickHandler: function() {

    }
  }
};

module.exports = BrowserAction;