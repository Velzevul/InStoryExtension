var constants = require('./constants.js');

var Logger = (function() {
  'use strict';

  var instance;

  function init() {
    console.log('creating Logger');

    return {
      log: function(msg) {
        console.log(msg);
      },
      error: function(msg) {
        console.error(msg);
      },
      serverLog: function(msg) {
        fetch(`${SERVER_URL}/log/${userId}/`, {
          method: 'POST',
          mode: 'CORS',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            log: {
              message
            }
          })
        })
          .then(response => response.json())
          .then(json => {
            if (json.success) {
              console.log('logging successful');
            } else {
              console.log('logging failed: ', json);
            }
          });
      }
    }
  }

  return {
    getInstance: function() {
      if (!instance) {
        instance = init();
      }

      return instance;
    }
  }
})();


module.exports = Logger;