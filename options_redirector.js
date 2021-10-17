
chrome.tabs.query({url:[chrome.runtime.getURL('options.html') + "?imagesRendered=true"]}, function(tabs)
{
    var popupUrl = chrome.runtime.getURL('options.html');
    if(tabs.length > 0)
        chrome.windows.update(tabs[0].windowId, {focused: true}, (window)=>{
            chrome.tabs.update(tabs[0].id, { url : popupUrl });
        })
    else
        chrome.tabs.create({ url: popupUrl, active: false }, function(tab) {
           chrome.windows.create({ tabId: tab.id, type: 'popup', focused: true, top: 100, left: 100, height: 645, width: 720});
        });
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){ window.close(); })
});  
