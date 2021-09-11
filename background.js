function createScreenshot(callback) {
  chrome.tabs.captureVisibleTab(null, { format: "png" }, callback);
}

chrome.contextMenus.create({
  title:"Pick an image on the current page to replace",
  contexts:["action"],
  id: "ScreeScrubberPickImageMenu",
});

chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ['content.js']
    });
  });

chrome.contextMenus.onClicked.addListener(function(info, tab){
  if (info.menuItemId == "ScreeScrubberPickImageMenu") {
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ["activatePicker.js"]
      });
    } 
  });

 chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
   if (msg.from == 'mouseup') {
     createScreenshot(function (dataURL) {
      chrome.tabs.create({
        url: chrome.runtime.getURL('pickedItemOptions.html') + 
          '?top=' + msg.top + 
          '&left=' + msg.left + 
          '&height=' + msg.height + 
          '&width=' + msg.width  +
          '&element=' + msg.element + 
          '&screenImg=' + dataURL,
        active: false
        }, function(tab) {
          chrome.windows.create({
            tabId: tab.id,
            type: 'popup',
            focused: true,
            top: 100,
            left: 100,
            height: 600,
            width: 700
        });
      });
    });
   }
 })