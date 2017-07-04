var logger = require('./Logger.js').getInstance();

module.exports = {
  EventEmitter = {
    'subscribers': {},
    'on': function on(event, cb) {
      let eventType = event || 'default';

      if (!this.subscribers[eventType]) {
        this.subscribers[eventType] = [];
      }
      this.subscribers[eventType].push(cb);
    },
    'off': function off(event, cb) {
      if (this.subscribers[event]) {
        this.subscribers[event] = this.subscribers[event].filter(function (item) {
          return cb !== item;
        });
      } else {
        logger.error(event + ' not found!');
      }
    },
    'trigger': function trigger(event, options) {
      let sub = this.subscribers[event];

      if (sub) {
        for (let i = 0, len = sub.length; i < len; i++) {
          sub[i](options);
        }
      } else {
        logger.log('EE.trigger: not found subscribers for ' + event + ' event');
      }
    },
    'offAll': function offAll(event) {
      if (this.subscribers[event]) {
        this.subscribers[event] = [];
      }
    }
  },
  parseSearchParams: function parseSearchParams(url) {
    const searchString = url.split('?')[1]
    const [oldQuery, newQuery] = searchString.split('#')
    const oldParams = {}
    let newParams = null

    for (let param of oldQuery.split('&')) {
      const decomposedParam = param.split('=')

      oldParams[decomposedParam[0]] = decomposedParam[1]
    }

    if (newQuery) {
      newParams = {}

      for (let param of newQuery.split('&')) {
        let decomposedParam = param.split('=')

        newParams[decomposedParam[0]] = decomposedParam[1]
      }
    }

    return [oldParams, newParams]
  },
  compareQueries: function compareQueries(q1, q2) {
    return q1 && q2 && q1.q === q2.q
  },

}