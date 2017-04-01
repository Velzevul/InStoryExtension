const tabQueries = {}
const googleImagesRegexp = /^https:\/\/www\.google\..*tbm=isch/
const googleImageRegexp = /^https:\/\/www\.google\.[^\/]*\/imgres\?imgurl=/

const googleEncryptedRegexp = /^https:\/\/encrypted-tbn[0123]\.gstatic\.com/
const base64Regexp = /^data:image.*/
const imageRegexp = /.*\.(?:jpe?g|png|gif|svg)$/

const SERVER_URL = 'https://localhost.com/server'

var iconBlinkInterval
var iconBlink = true
var recording = true
var userId = null
chrome.storage.local.get('INSTORY_USER_ID', ({'INSTORY_USER_ID': id}) => {
  if (id) {
    userId = id
    console.log(`logged in as ${userId}`)
    chrome.browserAction.setTitle({title: `Recording activity for ${userId}`})
    chrome.browserAction.setIcon({path: './icon-recording.png'})

    iconBlinkInterval = setInterval(() => {
      if (iconBlink) {
        chrome.browserAction.setIcon({path: './icon-recording.png'})
        iconBlink = false
      } else {
        chrome.browserAction.setIcon({path: './icon-recording-pause.png'})
        iconBlink = true
      }
    }, 1000)
  } else {
    console.log('not logged in')
    chrome.browserAction.setIcon({path: './icon-disabled.png'})
    chrome.browserAction.setTitle({title: 'You are not logged in'})
  }
})

const log = (message) => {
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

const parseSearchParams = url => {
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
}

const compareQueries = (q1, q2) => {
  return q1 && q2 && q1.q === q2.q
}

const recordImage = (image, query) => {
  fetch(`${SERVER_URL}/histories/${userId}/images`, {
    method: 'POST',
    mode: 'CORS',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image,
      query
    })
  })
    .then(response => response.json())
    .then(json => {
      if (json.success) {
        console.log('recorded image interaction', image, 'query', query)
      } else {
        console.log('error')
      }
    })
}

const searchForImages = (query) => {
  fetch(`${SERVER_URL}/histories/${userId}/queries`, {
    method: 'POST',
    mode: 'CORS',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query
    })
  })
    .then(response => response.json())
    .then(json => {
      if (json.success) {
        console.log(`success: searching for ${JSON.stringify(query)}`)
      } else {
        console.log('error')
      }
    })
}

const injectExtensionId = (tabId) => {
  chrome.management.getSelf(extension => {
    chrome.tabs.executeScript(tabId, {
      code: `
        (function(document){
          var div = document.getElementById('InStoryExtensionId')

          if (!div) {
            console.log('injecting extension id')
            div = document.createElement('div')
            div.id = 'InStoryExtensionId'
            div.dataset.id = '${extension.id}'
            document.body.appendChild(div)
          }
        })(document)
      `
    })
  })
}

chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  console.log(msg)
  if (msg.event === 'getInStoryUser') {
    sendResponse({userId})
  } else if (msg.event === 'setInStoryUser') {
    userId = msg.userId
    chrome.storage.local.set({INSTORY_USER_ID: msg.userId})
    chrome.browserAction.setIcon({path: './icon.png'})
    chrome.browserAction.setTitle({title: `Logged in as ${userId}`})
    sendResponse({userId})
  }
})

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.event === 'recordImage') {
    recordImage(msg.image, msg.query)
  }
})

chrome.tabs.onCreated.addListener(tab => {
  chrome.tabs.query({active: true, lastFocusedWindow: true}, function (activeTabs) {
    tabQueries[tab.id] = tabQueries[activeTabs[0].id]
  })
})

chrome.browserAction.onClicked.addListener(tab => {
  recording = !recording

  if (recording) {
    chrome.browserAction.setTitle({title: `Recording activity for ${userId}`})
    chrome.browserAction.setIcon({path: './icon-recording.png'})

    iconBlinkInterval = setInterval(() => {
      if (iconBlink) {
        chrome.browserAction.setIcon({path: './icon-recording-pause.png'})
        iconBlink = false
      } else {
        chrome.browserAction.setIcon({path: './icon-recording.png'})
        iconBlink = true
      }
    }, 1000)
  } else {
    clearTimeout(iconBlinkInterval)
    chrome.browserAction.setIcon({path: './icon.png'})
    chrome.browserAction.setTitle({title: `Logged in as ${userId}`})
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    injectExtensionId(tabId)

    console.log('here')

    if (recording) {
      console.log('recording')
      if (googleEncryptedRegexp.test(tab.url) || base64Regexp.test(tab.url) || imageRegexp.test(tab.url)) {
        recordImage({
          src: tab.url,
          url: tab.url
        }, JSON.stringify(tabQueries[tab.id]))
      } else if (googleImageRegexp.test(tab.url) || googleImagesRegexp.test(tab.url)) {
        const [oldSearchParams, newSearchParams] = parseSearchParams(tab.url)
        const combinedSearchParams = Object.assign({}, oldSearchParams, newSearchParams)

        if (googleImagesRegexp.test(tab.url)) {
          let currentQuery = {
            q: combinedSearchParams.q,
            url: tab.url
          }

          if (!compareQueries(currentQuery, tabQueries[tabId])) {
            searchForImages(currentQuery)
            tabQueries[tabId] = currentQuery
          }
        }

        const inspectedImageCode = combinedSearchParams.imgdii || combinedSearchParams.imgrc

        if (inspectedImageCode && inspectedImageCode !== '_') {
          chrome.tabs.executeScript(tabId, {
            code: `(
              function(){
                clearTimeout(window.inStoryInterval)

                if (window.inspectedImageCode !== "${inspectedImageCode}") {
                  window.inspectedImageCode = "${inspectedImageCode}"
                  window.inStoryInterval = setInterval(function() {
                    var targetDivs = document.querySelectorAll('div[data-item-id="${inspectedImageCode}"]')

                    if (targetDivs.length === 2) {
                      var targetImg = targetDivs[0].querySelector('img.irc_mi')
                      var targetImgThumb = targetDivs[1].querySelector('img.irc_rii')

                      if (targetImg && targetImg.src && targetImg.naturalHeight) {
                        console.log(targetDivs)

                        clearTimeout(window.inStoryInterval)
                        chrome.runtime.sendMessage({
                          event: 'recordImage',
                          image: {
                            src: targetImg.src,
                            height: targetImg.naturalHeight,
                            width: targetImg.naturalWidth,
                            thumbSrc: targetImgThumb.src,
                            url: document.URL
                          },
                          query: ${JSON.stringify(tabQueries[tab.id])}
                        })
                      }
                    }
                  }, 100)
                }
              }
            )()`
          })
        }
      }
    }
  }
})
