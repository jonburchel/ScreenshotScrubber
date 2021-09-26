var ImageArrayJson = "";

function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function findAndReplace(searchText, replacement, searchNode) {
    var regex = new RegExp("((?<=>)[^<]*)(" + escapeRegex(searchText) + ")([^<]*)", 'g');
    searchNode.innerHTML = searchNode.innerHTML.replace(regex, "$1" + replacement + "$3")
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
        function replace(selector, text, newText) 
        {
            var elements = document.querySelectorAll(selector);
            Array.prototype.filter.call(elements, function(element){
            if (text === element.textContent) {
                element.textContent = newText;
            }
            });
        }
        for (var i = 0; i < ca.ConfigArray.length; i++)
            findAndReplace(ca.ConfigArray[i][0], ca.ConfigArray[i][1], document.body);
    }
});

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

            //incomplete...  only matches if a single element has all criteria, 
            //but need to match if any element where it or any child elements have the criteria too...
            var qry = (currentImg.matchID ? "[id='" + idMatch.id + "']" : "") +
                (currentImg.matchSrc ? "[src='" + srcMatch.id + "']" : "") +
                (currentImg.matchHref ? "[href='" + hrefMatch.id + "']" : "") +
                (currentImg.matchClass ? "[class='" + classMatch.id + "']" : "");
            document.querySelectorAll(qry)[0].replaceWith(img);
        }
    }
});

