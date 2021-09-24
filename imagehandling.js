var ImgData = new Array();
var ReplaceImgValues = new Array();
var imgDetails = {};

document.body.addEventListener("load", ProcessImages());

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function updateImageStore(objectToStore) {
    var jsonstr = JSON.stringify(objectToStore);
    var i = 0;
    var storageObj = {};
    var key = "ImageStore";

    // split jsonstr into chunks and store them in an object indexed by `key_i`
    while(jsonstr.length > 0) {
        var index = key + "_" + i++;

        // since the key uses up some per-item quota, see how much is left for the value
        // also trim off 2 for quotes added by storage-time `stringify`
        const maxLength = chrome.storage.local.QUOTA_BYTES_PER_ITEM - index.length - 200;
        var valueLength = jsonstr.length;
        if(valueLength > maxLength){
            valueLength = maxLength;
        }

        // trim down segment so it will be small enough even when run through `JSON.stringify` again at storage time
        //max try is QUOTA_BYTES_PER_ITEM to avoid infinite loop
        var segment = jsonstr.substr(0, valueLength); 
        for(let i = 0; i < chrome.storage.local.QUOTA_BYTES_PER_ITEM; i++){
            const jsonLength = JSON.stringify(segment).length;
            if(jsonLength > maxLength){
                segment = jsonstr.substr(0, --valueLength);
            }else {
                break;
            }
        }

        storageObj[index] = segment;
        chrome.storage.local.set({[index]: storageObj[index]});
        jsonstr = jsonstr.substr(valueLength);
    }
    
    chrome.storage.local.set({ImageStoreLength: i});
}

function readStorageSynchronous (key) {
    return new Promise((resolve) => {
        chrome.storage.local.get(key, function (result) {    
            if (result[key] === undefined) {
                resolve(undefined);
              } else {
                ImgData += result[key];
                resolve(result[key]);
              }
        });
    });
}

function getImageStore(imageElement, callback) {
    chrome.storage.local.get("ImageStoreLength", async function (StoreLen){
        for (var StoreItem = 0; StoreItem < StoreLen.ImageStoreLength; StoreItem++)
        {
            var key = "ImageStore_" + StoreItem.toString();
            await readStorageSynchronous(key);
        }
        callback(imageElement);
    });
}

function htmlEscape(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function BoldAttr(tags, attributeToBold, clearFirst=false)
{
    tags = tags.replaceAll("<b style=\"background-color: yellow;\">", "___BSTART___").replaceAll("</b>", "___BEND___").replaceAll("\"", "&quot;").replaceAll("___BSTART___", "<b style=\"background-color: yellow;\">").replaceAll("___BEND___", "</b>");
    if (clearFirst)
        tags = tags.replaceAll("<b style=\"background-color: yellow;\">", "").replaceAll("</b>", "");
    var rx = null;
    if (attributeToBold == "src")
        rx = new RegExp("(src)\\s*=\\s*&quot;((?!<i>&lt;inline data&gt;</i>).*?)&quot;", "i");
    else
        rx = new RegExp("(" + attributeToBold.toLowerCase() + ")\\s*=\\s*&quot;(.*?)&quot;", "i");

    return tags.replace(rx, "<b style=\"background-color: yellow;\">$1</b>=&quot;<b style=\"background-color: yellow;\">$2</b>&quot;");
} 

function BoldTag()
{
    var rx = new RegExp("[A-Za-z]*");
    var r = this.id.replace(rx, '');
    var s = document.getElementById("htmlTag" + r).innerHTML.replaceAll("<b style=\"background-color: yellow;\">", "").replaceAll("</b>", "");
    if (document.getElementById("matchId" + r).checked)
        s = BoldAttr(s, "id");
    if (document.getElementById("matchClass" + r).checked)
        s = BoldAttr(s, "class");
    if (document.getElementById("matchSrc" + r).checked)
        s = BoldAttr(s, "src");
    if (document.getElementById("matchHref" + r).checked)
        s = BoldAttr(s, "href");
   
    document.getElementById("htmlTag" + r).innerHTML = s;
}

function ProcessImages()
{
    var imageElement = getQueryVariable("imageElement");
    if (imageElement != undefined)
    {
        var t = Math.round(getQueryVariable("top"), 0);
        var l = Math.round(getQueryVariable("left"), 0);
        var w = Math.round(getQueryVariable("width"), 0);
        var h = Math.round(getQueryVariable("height"), 0);
        var r = getQueryVariable("pixelRatio");
        var iw = getQueryVariable("imgWidth");
        var imgSrc = getQueryVariable("screenImg");
        var useSrc = false;
        var replacementURL = "";
        imgDetails = {imageElement, useSrc, replacementURL, t, l, w, h, r, iw, imgSrc};
    }

    getImageStore(imageElement, function(imageElement) { 
        if (ImgData!= "")
        {
            ReplaceImgValues = JSON.parse(ImgData);
            for (var i = 0; i < ReplaceImgValues.length; i++)
            {
                if (ReplaceImgValues[i]["imageElement"] == imageElement)
                    break;
            }
            if (i == ReplaceImgValues.length && imageElement != undefined)
                ReplaceImgValues.splice(ReplaceImgValues.length, 0, imgDetails);
        }
        else
        {
            if (imageElement == undefined)
            {
                // only happens the first time the tool options are accessed if no image was picked and none exist already, providing a default
                imgDetails = {
                    "imageElement": "<img class=\"fxs-avatarmenu-tenant-image\">",
                    "useSrc": false,
                    "replacementURL": "https://portal.azure.com/Content/static/MsPortalImpl/AvatarMenu/AvatarMenu_defaultAvatarSmall.png"
                };
            }
            ReplaceImgValues = new Array(imgDetails);
        }
        updateImageStore(ReplaceImgValues);
        
        // ugly, but there is a weird behavior where the first time one of the images is loaded, it does not appear.  
        // refreshing the page consistently after a new images has been added allows rendering then...
        if (getQueryVariable("imagesRendered") == undefined)
        {
            window.location = chrome.runtime.getURL('options.html?imagesRendered=true');
        }
        else
        {
            //removes display:none and sets bgcolor. this hides the refresh flash...
            document.body.style = "background-color:cornflowerblue;"; 
        }

        var ImgList = document.getElementById("ImageList");

        for (var i = 0; i < ReplaceImgValues.length; i++)
        {
            ImgList.insertRow(ImgList.rows.length - 1);
            const RemoveInlineSrcData = /src=.*\"/g;
            var scrubbedElement = ReplaceImgValues[i].imageElement.replace(RemoveInlineSrcData, "src=\"<inline data>\"");
            const RemoveInlineSrcSetData = /srcset=.*\"/g;
            scrubbedElement = htmlEscape(scrubbedElement.replace(RemoveInlineSrcSetData, "")).replace("&lt;inline data&gt;", "<i>&lt;inline data&gt;</i>");
            ImgList.rows[ImgList.rows.length - 2].innerHTML = 
             "<td><div id=\"imageCropDiv_" + i + "\"><img id=\"imageCanvas_" + i + "\"></img></div></td>" + 
             "<td style=\"font-size: x-small;\" id=\"htmlTag" + i + "\">" +  scrubbedElement + "</td>" +
             "<td style=\"border-left: 1px dashed gray\"><center><input type=\"checkbox\" id=\"matchId" + i + "\" name=\"matchId" + i + "\"></center></td>" +
             "<td style=\"border-left: 1px dashed gray\"><center><input type=\"checkbox\" id=\"matchClass" + i + "\" name=\"matchClass" + i + "\"></center></td>" +
             "<td style=\"border-left: 1px dashed gray\"><center><input type=\"checkbox\" id=\"matchSrc" + i + "\" name=\"matchSrc" + i + "\"></center></td>" +
             "<td style=\"border-left: 1px dashed gray\"><center><input type=\"checkbox\" id=\"matchHref" + i + "\" name=\"matchHref" + i + "\"></center></td>" +
             "<td style=\"border-left: 1px dashed gray;\"><center><input type=\"checkbox\" id=\"scaleToOld" + i + "\" name=\"scaleToOld" + i + "\"></center></td>" +
             "<td style=\"border-left: 1px dashed gray\"><center><label style=\"cursor:pointer;color:blue;text-decoration:underline;\">Browse<input type=\"file\" style=\"position: fixed; top: -100em\" id=\"browse" + i + "\"></label><center></td>" +
             "<td style=\"\"><img valign=bottom src=\"./images/minus.png\" id=\"DeleteImg" + i + "\"></td>";
            document.getElementById("matchId" + i).addEventListener("change", BoldTag);
            document.getElementById("matchHref" + i).addEventListener("change", BoldTag);
            document.getElementById("matchSrc" + i).addEventListener("change", BoldTag);
            document.getElementById("matchClass" + i).addEventListener("change", BoldTag);
            var imageCropDiv = document.getElementById("imageCropDiv_" + i);
            var imageCanvas = document.getElementById("imageCanvas_" + i);
            var t = ReplaceImgValues[i].t;
            var l = ReplaceImgValues[i].l;
            var w = ReplaceImgValues[i].w;
            var h = ReplaceImgValues[i].h;
            var r = ReplaceImgValues[i].r;
            var imgWidth = ReplaceImgValues[i].iw;
            var imgSrc = ReplaceImgValues[i].imgSrc;
            var useSrc = false;
            var replacementURL = "";
            var thumbnailSize = 42;
            
            if (imgSrc != undefined) 
            {
                imageCanvas.src = imgSrc;
                imageCanvas.width = Math.round(imageCanvas.width / r * (thumbnailSize / w));  
                imageCanvas.style = "margin: -" + Math.round(t * (thumbnailSize/w)) + "px 0 0 -" + Math.round(l * (thumbnailSize/w))+ "px;"; 
                imageCropDiv.style = "width: " + thumbnailSize + "px;height: " + thumbnailSize/w * h + "px;border: 2px solid gray;overflow: hidden;";  
                
            }
        }

    });
}