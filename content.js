var ImageArrayJson = "";

function findAndReplace(s, replacement, matchCase) {
    var markInstance = new Mark(document.body);
    markInstance.unmark({
        done: function(){
            markInstance.mark(s, {
                accuracy: "partially",
                className: "ScreenshotScrubberHighlightedText", 
                ignoreJoiners: true,
                acrossElements: true,
                caseSensitive: matchCase,
                iframes: true,
                iframesTimeout: 500,
                separateWordSearch: false,
                element: "span",
                exclude: [".ignore", "noscript", "script"],
                filter: (node, range, term, count) => {
                    if (node.parentElement.offsetParent == null)
                        return false;
                    else 
                        return true;
                },
                done: count => { 
                    var searchText = s.toLowerCase();
                    var marks = document.getElementsByClassName("ScreenshotScrubberHighlightedText");
                    foundCount = 0;
                    var curMatchesString = "";
                    var i = 0;
                    while (i < marks.length)
                    {
                        if (curMatchesString == "")
                        {
                            curMatchesString = marks[i].innerText;
                            marks[i].parentElement.replaceChild(document.createTextNode(replacement), marks[i]);
                        }
                        else
                        {
                            curMatchesString += marks[i].innerText;
                            marks[i].remove();
                        }
                        if (curMatchesString.toLowerCase() === searchText)
                        {
                            foundCount++;
                            curMatchesString = "";
                        }
                    }
                }
            });
        }
    });
    
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
        for (var i = 0; i < ca.ConfigArray.length; i++)
        {
            findAndReplace(ca.ConfigArray[i][0], ca.ConfigArray[i][1], ca.ConfigArray[i][2]);
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
                          
                    //incomplete...  only matches if a single element has all criteria, 
                    //but need to match if any element where it or any child elements have the criteria too...
                    var qry = (currentImg.matchID ? "[id='" + idMatch.id + "']" : "") +
                        (currentImg.matchSrc ? "[src='" + srcMatch.src + "']" : "") +
                        (currentImg.matchHref ? "[href='" + hrefMatch.href.baseVal + "']" : "") +
                        (currentImg.matchClass ? "[class='" + classMatch.className + "']" : "");
                    var matches = document.querySelectorAll(qry);
                    
                    var img= document.createElement("img");
                    img.src = currentImg.replacementURL;
                    img.width = currentImg.w;
                    img.height = currentImg.h;
                    img.style.objectFit = "cover"

                    for (var j = 0; j < matches.length; j++)
                    {
                        var match = matches[j];
                        if (match.href != undefined) // href containing svg's should be replaced by parent element...
                            match = match.parentElement;
                        if (currentImg.replacementURL != "")
                        {
                            img.className = match.className;  // this often preserves formatting for the image, e.g. rounded corners, etc.
                            match.replaceWith(img);
                        }
                        else
                            match.remove();
                    }
                }
            }

            setTimeout(() => { 
                alert("The page was scrubbed!\n\nIf an image didn't get replaced correctly, try changing the match criteria.");
            }, 333);
        });       
    }
});