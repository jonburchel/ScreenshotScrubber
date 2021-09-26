chrome.tabs.query({url:[chrome.runtime.getURL('options.html') + "?imagesRendered=true"]},async function(tabs)
{
    var popupUrl = chrome.runtime.getURL('options.html');

    if(tabs.length > 0)
        chrome.tabs.update(tabs[0].id, { url : popupUrl });
    else
        await chrome.tabs.create({ url: popupUrl, active: false }, async function(tab) {
           await chrome.windows.create({ tabId: tab.id, type: 'popup', focused: true, top: 100, left: 100, height: 800, width: 700});
        });
    window.close();
});  
