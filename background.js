function createScreenshot(callback) {
  chrome.tabs.captureVisibleTab(null, { format: "png" }, callback);
}

var lastActiveTabId = null;
var lastActiveWindowId = null;
chrome.windows.onFocusChanged.addListener((winId)=>{
  chrome.tabs.query( {windowId: winId, active: true}, (tabs)=>{
    chrome.tabs.get(tabs[0].id, tab=> {
      if (tab.url != "chrome://extensions/" && tab.url.trim() != "" && tab.url.indexOf("devtools://", 0) != 0 && tab.url.indexOf("chrome-extension://", 0) != 0)
      {
        lastActiveTabId = tabs[0].id;
        lastActiveWindowId = tabs[0].windowId;
      }
    });
  });
});
chrome.tabs.onActivated.addListener((info)=>{
  chrome.tabs.get(info.tabId, function(tab) {
        if (tab.url != "chrome://extensions/" && tab.url.trim() != "" && tab.url.indexOf("devtools://", 0) != 0 && tab.url.indexOf("chrome-extension://", 0) != 0)
        {
          lastActiveTabId = info.tabId;
          lastActiveWindowId = tab.windowId;
        }
    });
});

chrome.runtime.onInstalled.addListener(()=>{
  chrome.contextMenus.create({
    title:"Pick an image on the current page to replace (Alt+H)",
    contexts:["action"],
    id: "ScreenScrubberPickImageMenu",
  });

  chrome.contextMenus.create({
    title:"Replace selected text with Screenshot Scrubber (Ctrl+Shift+H)",
    contexts: ["selection"],
    id: "ScreenScrubberReplaceSelectionMenu"
  });

  chrome.contextMenus.create({
    title:"Replace image with Screenshot Scrubber",
    contexts: ["image"],
    id: "ScreenScrubberReplaceImageMenu"
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
  if(info.menuItemId == "ScreenScrubberReplaceImageMenu")
  {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      chrome.tabs.sendMessage(tabs[0].id, {action: "ReplaceImage", info: info}, function(response) {});  
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
  if (c=="ReplaceImage")
  {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ["activatePicker.js"]
    });
  }
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) 
{
  if (msg.from == 'test')
  {
    return Promise.resolve("Message handled.");
  }
  if (msg.from == 'mouseup') 
  {
    createScreenshot(function (dataURL) 
    {       
      chrome.tabs.query({url:chrome.runtime.getURL('options.html') + "?imagesRendered=true"},function(tabs)
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
          //chrome.windows.update(tabs[0].windowId, {focused: true}, (window)=>{
            chrome.tabs.update(tabs[0].id, { url : qryUrl });
          //});
        else
          chrome.tabs.create({ url: qryUrl, active: false }, function(tab) {
            chrome.windows.create({ tabId: tab.id, type: 'popup', focused: true, top: 100, left: 100, height: 775, width: 700});
          });
        return Promise.resolve("Message handled.");
      });           
    });
  }
  if (msg.from == "replaceText")
  {
    chrome.tabs.query({url:[chrome.runtime.getURL('options.html') + "?imagesRendered=true"]},function(tabs)
    {
      if(tabs.length > 0)
      {
        chrome.windows.update(tabs[0].windowId, {focused: true}, (window)=>{
          chrome.tabs.update(tabs[0].id, { url : chrome.runtime.getURL('options.html') + "?imagesRendered=true"  });
        });
      }
      return Promise.resolve("Message handled.");
    });
  }
  if (msg.from == "replaceImageFromOptions")
  {
    if(lastActiveWindowId != null && lastActiveTabId != null)
    {
      chrome.windows.update(lastActiveWindowId, {focused: true}, (window) => {
        chrome.tabs.update(lastActiveTabId, {active: true}, tab=>{
          if (tab.url.lastIndexOf("chrome", 0) == 0)
          {
            console.log(tab.url);
            sendResponse({status: "ChromeURL"});
            return Promise.resolve("Chrome URL was last active tab");
          }
          else
          {
            chrome.scripting.executeScript({
              target: {tabId: lastActiveTabId},
              files: ["activatePicker.js"]
            });
            sendResponse({status: "Success"});
            return Promise.resolve("Success");
          }
        });
      });
    }
    else
    {
      sendResponse({status: "NoWindow"});
      return Promise.resolve("NoWindow");
    }
  }
});

