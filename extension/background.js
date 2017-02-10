const tabQueries = {}
const googleImagesRegexp = /^https:\/\/www\.google\..*tbm=isch/
const googleImageRegexp = /^https:\/\/www\.google\.[^\/]*\/imgres\?imgurl=/

const imgrcRegexp = /imgrc=([^:]*):/
const imgdiiRegexp = /imgdii=([^:]*):/

const googleEncryptedRegexp = /https:\/\/encrypted-tbn[0123]\.gstatic\.com/
const base64Regexp = /^data:image.*/
const imageRegexp = /.*\.(?:jpe?g|png|gif|svg)$/

const parseSearchParams = url => {
  const searchString = url.split('?')[1]
  let searchParams = {}

  for (let param of searchString.split('&')) {
    let decomposedParam = param.split('=')

    searchParams[decomposedParam[0]] = decomposedParam[1]
  }

  return searchParams
}

chrome.tabs.onCreated.addListener(tab => {
  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (activeTabs) {
    tabQueries[tab.id] = tabQueries[activeTabs[0].id]
  })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    if (googleEncryptedRegexp.test(tab.url) || base64Regexp.test(tab.url) || imageRegexp.test(tab.url)) {
      // right-click a thumbnail -> open the "google encrypted" image in a new tab
      console.log(`inspecting image ${tab.url} for query ${tabQueries[tabId]}`)
    } else if (googleImageRegexp.test(tab.url) || googleImagesRegexp.test(tab.url)) {
      if (googleImagesRegexp.test(tab.url)) {
        const urlSearchParams = parseSearchParams(tab.url)

        if (urlSearchParams.q && urlSearchParams.q !== tabQueries[tabId]) {
          console.log(`${tabId}: searching for: ${urlSearchParams.q}`)
          tabQueries[tabId] = urlSearchParams.q
        }
      }

      if (imgdiiRegexp.test(tab.url)) {
        const imgdii = imgdiiRegexp.exec(tab.url)[1]
        chrome.tabs.executeScript(tabId, {
          code: `(
            function(){
              if (!window.intervals) {
                window.intervals = {}
              }

              if (!window.intervals['${imgdii}']) {
                window.intervals['${imgdii}'] = setInterval(function() {
                  var targetImg = document.querySelector('div[data-item-id="${imgdii}:"] img.irc_mi')

                  if (targetImg && targetImg.src) {
                    clearTimeout(window.intervals['${imgdii}'])
                    console.log('inspecting image (related) ' + targetImg.src + ' for query ${tabQueries[tabId]}')
                  }
                }, 100)
              }
            }
          )()`
        })
      } else if (imgrcRegexp.test(tab.url)) {
        const imgrc = imgrcRegexp.exec(tab.url)[1]
        chrome.tabs.executeScript(tabId, {
          code: `(
            function(){
              if (!window.intervals) {
                window.intervals = {}
              }

              if (!window.intervals['${imgrc}']) {
                window.intervals['${imgrc}'] = setInterval(function() {
                  var targetImg = document.querySelector('div[data-item-id="${imgrc}:"] img.irc_mi')

                  if (targetImg && targetImg.src) {
                    clearTimeout(window.intervals['${imgrc}'])
                    console.log('inspecting image ' + targetImg.src + ' for query ${tabQueries[tabId]}')
                  }
                }, 100)
              }
            }
          )()`
        })
      }
    }
  }
})
