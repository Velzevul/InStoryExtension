var EventEmitter = require('./lib.js').EventEmitter;
var constants = require('./constants.js');

EventEmitter.on('set user', ...);
EventEmitter.on('set state', ...);

EventEmitter.trigger('set user', {userId: null});
EventEmitter.trigger('set state', {state: 'disabled'});

chrome.storage.local.get(constants.USER_ID_KEY, function(obj) {
  var userId = obj[constants.USER_ID_KEY];

  if (userId) {
    EventEmitter.trigger('setUser', {userId: userId});
  }
})

var eventListener = function eventListener(msg, sender, sendResponse) {
  switch (msg.event) {
    case 'getInStoryUser':
      sendResponse({
        userId
      })
      break
    case 'setInStoryUser':
      EventEmitter.trigger('set user', {userId: msg.userId})
      break
    case 'recordImage':
      break
    default:
      logger.log('unrecognized event:' + JSON.stringify(msg);
  }
};

chrome.runtime.onMessage.addListener(eventListener);
chrome.runtime.onMessageExternal.addListener(eventListener);

chrome.tabs.onCreated.addListener(function(tab) {
  chrome.tabs.query({active: true, lastFocusedWindow: true}, function(activeTabs) {
    EventEmitter.trigger('')
  })
})