function createScreenshot(callback) {
  chrome.tabs.captureVisibleTab(null, { format: "png" }, callback);
}

chrome.runtime.onInstalled.addListener(()=>{
  chrome.contextMenus.create({
    title:"Pick an image on the current page to replace",
    contexts:["action"],
    id: "ScreenScrubberPickImageMenu",
  });

  chrome.contextMenus.create({
    title:"Replace selected text with Screenshot Scrubber",
    contexts: ["selection"],
    id: "ScreenScrubberReplaceSelectionMenu"
  });
});

chrome.contextMenus.onClicked.addListener(function(info, tab){
  if (info.menuItemId == "ScreenScrubberPickImageMenu") {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ["activatePicker.js"]
    });
  }
  if (info.menuItemId == "ScreenScrubberReplaceSelectionMenu") {
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ["replaceselection.js"]
      });
  } 
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['content.js']
  });
});

chrome.commands.onCommand.addListener((c, tab)=>{
  if (c=="ReplaceSelection")
  {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ["replaceselection.js"]
    });
  }
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) 
{
  if (msg.from == 'mouseup') 
  {
    createScreenshot(function (dataURL) 
    {           
      chrome.tabs.query({url:[chrome.runtime.getURL('options.html') + "?imagesRendered=true"]},function(tabs)
      {
        var popupUrl = chrome.runtime.getURL('options.html');
        var qryUrl = popupUrl + 
          '?top=' + msg.top + 
          '&left=' + msg.left + 
          '&height=' + msg.height + 
          '&width=' + msg.width  +
          '&imageElement=' + msg.element + 
          '&imgWidth=' + msg.imgWidth +
          '&pixelRatio=' + msg.pixelRatio +
          '&screenImg=' + dataURL;
        if(tabs.length > 0)
        {
            chrome.tabs.update(tabs[0].id, { url : qryUrl });
        }
        else
          chrome.tabs.create({ url: qryUrl, active: false }, function(tab) {
            chrome.windows.create({ tabId: tab.id, type: 'popup', focused: true, top: 100, left: 100, height: 775, width: 700});
          });
      });           
    });
  }
});

