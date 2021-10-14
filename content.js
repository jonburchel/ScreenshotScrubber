var ImageArrayJson = "";

function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function findAndReplace(searchText, replacement, searchNode) {
    var regex = new RegExp("((?<=>)[^<]*)(" + escapeRegex(searchText) + ")([^<]*)", 'g');
    try { 
        searchNode.innerHTML = searchNode.innerHTML.replace(regex, "$1" + replacement + "$3") 
    } catch(e) {} // ignore any errors caused by script replacement on the page
}

function ReadImageStorageSynchronous (key) {
    return new Promise((resolve) => {
        chrome.storage.local.get(key, function (result) {    
            if (result[key] === undefined) {
                resolve(undefined);
              } else {
                ImageArrayJson += result[key];
                resolve(result[key]);
              }
        });
    });
}

function LoadImagesFromStorage(callback) {
    chrome.storage.local.get("ImagesToReplaceLength", async function (StoreLen){
        for (var StoreItem = 0; StoreItem < StoreLen.ImagesToReplaceLength; StoreItem++)
        {
            var key = "ImagesToReplace_" + StoreItem.toString();
            await ReadImageStorageSynchronous(key);
        }
        callback();
    });
}

chrome.storage.sync.get("ConfigArray", function(ca) { 
    if (ca.ConfigArray == null)
        alert("This extension must be configured before its first use.\rRight-click to select Options for initial configuration.");
    else
    {
        if (confirm("Warning:  Replacing images or text might leave the page unresponsive.\r\nYou can refresh the page to restore its functionality.\r\n\r\nDo you want to scrub this page now?"))
        {
            for (var i = 0; i < ca.ConfigArray.length; i++)
            {
                findAndReplace(ca.ConfigArray[i][0], ca.ConfigArray[i][1], document.body);
            }
            LoadImagesFromStorage(function () {
                if (ImageArrayJson!= "")
                {
                    ImagesToReplace = JSON.parse(ImageArrayJson);
                    var elem = document.createElement("html");
                    for (var i = 0; i < ImagesToReplace.length; i++)
                    {
                        var currentImg = ImagesToReplace[i];
                        elem.innerHTML = currentImg.imageElement;
            
                        var idMatch = elem.querySelector("[id]");
                        var classMatch = elem.querySelector("[class]");
                        var hrefMatch = elem.querySelector("[href]");
                        var srcMatch = elem.querySelector("[src]");
            
                        var img= document.createElement("img");
                        img.src = currentImg.replacementURL;
                        img.width = currentImg.w;
                        img.height = currentImg.h;
                        img.style.objectFit = "cover"
            
                        //incomplete...  only matches if a single element has all criteria, 
                        //but need to match if any element where it or any child elements have the criteria too...
                        var qry = (currentImg.matchID ? "[id='" + idMatch.id + "']" : "") +
                            (currentImg.matchSrc ? "[src='" + srcMatch.src + "']" : "") +
                            (currentImg.matchHref ? "[href='" + hrefMatch.href.baseVal + "']" : "") +
                            (currentImg.matchClass ? "[class='" + classMatch.className + "']" : "");
                        var matches = document.querySelectorAll(qry);
                        
                        for (var j = 0; j < matches.length; j++)
                        {
                            var match = matches[j];
                            if (match.href != undefined) // href containing svg's should be replaced by parent element...
                                match = match.parentElement;
                            if (currentImg.replacementURL != "")
                                match.replaceWith(img);
                            else
                                match.remove();
                        }
                    }
                }
                alert("The page was scrubbed!\n\nIf an image didn't get replaced correctly, try changing the match criteria.\n\nIf text didn't get replaced correctly, it could be because there is HTML that breaks the visible text up.  Changes in visual formatting are often responsible for this (e.g. sections of bold or italic or a link embedded within the text).  Try replacing the text in smaller sub-segments, so each segment has no formatting differences.");
            });       
        }     
    }
});



