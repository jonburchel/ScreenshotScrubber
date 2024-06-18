var ImageArrayJson = "";
var ImagesToReplace = new Array();
var PickedImageDetails = {};
var ImgTable = null;
var PageLoading = true;
var ThumbnailSize = 42;

document.body.addEventListener("load", ProcessImages());

function CreateUniqueID(numDigits = 10) 
{
    var s = "";
    s += Math.round(Math.random() * 9.5 + .5).toString(); //forces first number to be non-zero
    for (var i = 0; i < numDigits - 1; i++)
        s += Math.round(Math.random() * 9.5 - .5).toString();
    return s;
}

function GetQueryVariable(variable) {
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

function htmlEscape(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function UpdateImageStore(objectToStore, key) {
    var jsonstr = JSON.stringify(objectToStore);
    var i = 0;
    var storageObj = {};

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
    
    chrome.storage.local.set({[key + "Length"]: i});
}

function ReadImageStorageSynchronous (key) {
    return new Promise((resolve) => {
        chrome.storage.local.get(key, function (result) {    
            if (result[key] === undefined) {
                resolve(true);
              } else {
                ImageArrayJson += result[key];
                resolve(true);
              }
            return true;
        });
    });
}

function LoadImagesFromStorage(imageElement, callback) {
    chrome.storage.local.get("ImagesToReplaceLength", async function (StoreLen){
        for (var StoreItem = 0; StoreItem < StoreLen.ImagesToReplaceLength; StoreItem++)
        {
            var key = "ImagesToReplace_" + StoreItem.toString();
            let response = await ReadImageStorageSynchronous(key);
        }
        callback(imageElement);
        return true;
    });
}

function BoldAttr(tags, attributeToBold, clearFirst=false)
{
    tags = tags.replaceAll("<b style=\"background-color: #9bc3f0;\">", "___BSTART___").replaceAll("</b>", "___BEND___").replaceAll("\"", "&quot;").replaceAll("___BSTART___", "<b style=\"background-color: #9bc3f0;\">").replaceAll("___BEND___", "</b>");
    if (clearFirst)
        tags = tags.replaceAll("<b style=\"background-color: #9bc3f0;\">", "").replaceAll("</b>", "");
    var rx = new RegExp("(" + attributeToBold.toLowerCase() + ")\\s*=\\s*&quot;(.*?)&quot;", "i");
    return tags.replace(rx, "<b style=\"background-color: #9bc3f0;\">$1</b>=&quot;<b style=\"background-color: #9bc3f0;\">$2</b>&quot;");
} 

function BoldTag(e)
{
    var rx = new RegExp("([A-Za-z]*)", "g");
    var r = "-1";
    if (typeof e == "string")
        r = e;
    else
        r = this.id.replace(rx, "");

    var s = document.getElementById("htmlTag" + r).innerHTML.replaceAll("<b style=\"background-color: #9bc3f0;\">", "").replaceAll("</b>", "");
    var id = document.getElementById("matchId" + r);
    var href = document.getElementById("matchHref" + r);
    var src = document.getElementById("matchSrc" + r);
    var cls = document.getElementById("matchClass" + r);
    if (id != null && id.checked) s = BoldAttr(s, "id");
    if (cls != null && cls.checked) s = BoldAttr(s, "class");
    if (src != null && src.checked) s = BoldAttr(s, "src");
    if (href != null && href.checked) s = BoldAttr(s, "href"); 
    document.getElementById("htmlTag" + r).innerHTML = s;
    
    if (id != null) ImagesToReplace.find(i=>i.imgId == r).matchID = id.checked;
    if (href != null) ImagesToReplace.find(i=>i.imgId == r).matchHref = href.checked;
    if (src != null) ImagesToReplace.find(i=>i.imgId == r).matchSrc = src.checked;
    if (cls != null) ImagesToReplace.find(i=>i.imgId == r).matchClass = cls.checked;
    UpdateImageStore(ImagesToReplace, "ImagesToReplace");
    if (!PageLoading) FlashSaved();
}

function DelImg(e)
{
    var rx = new RegExp("[A-Za-z]*", "g");
    var r = this.id.replace(rx, "");
    ImgTable.deleteRow(ImagesToReplace.findIndex(i=>i.imgId == r) + 2);
    ImagesToReplace.splice(ImagesToReplace.findIndex(i=>i.imgId == r), 1);
    UpdateImageStore(ImagesToReplace, "ImagesToReplace");
    if (ImagesToReplace.length == 0)
    {
        ImgTable.style.display = "none";
        document.getElementById("NoImagesText").style.display = "inline";
        document.getElementById("AfterImagesText").style.display = "none";
    }
    FlashSaved();
}

async function ImageSelected(e)
{
    var r = null; var rib = null;
    console.log(e);
    var rx = new RegExp("[A-Za-z]*", "g");
    console.log (e.type, e.target.id);
    if (e.type == "change") r = e.target.id; else r = "";
    if (r == "") r = document.elementFromPoint(e.clientX, e.clientY).parentNode.id.replace(rx, "");
    if (r == "") r = document.elementFromPoint(e.clientX, e.clientY).id.replace(rx, "");
    console.log(r);
    rib = document.getElementById("ReplaceImageButton" + r);

    if (e.srcElement.parentElement.id.search("btnNoImg") != -1 || e.srcElement.id.search("btnNoImg") != -1)
    {
        rib.style.background = "";
        rib.innerHTML = "<b>remove: no new image</b>"
        ImagesToReplace.find(i=>i.imgId == r).replacementURL = "";
        UpdateImageStore(ImagesToReplace, "ImagesToReplace");
    } else
    if (e.srcElement.id.search("btnDefaultImg") != -1)
    {
        rib.style.background = "url(./images/AvatarMenu_defaultAvatarSmall.png)";
        var request = new XMLHttpRequest();
        request.open('GET', "./images/AvatarMenu_defaultAvatarSmall.png", true);
        request.responseType = 'blob';
        request.onload = function() {
            var reader = new FileReader();
            reader.onloadend = function() {
                var rx = new RegExp("[A-Za-z]*", "g");
                var r = e.srcElement.id.replace(rx, "");
                var ReplaceImageButton = document.getElementById("ReplaceImageButton" + r);
                ReplaceImageButton.style.background = "url(" + reader.result + ")";
                ReplaceImageButton.style.backgroundRepeat = "no-repeat"; 
                ReplaceImageButton.style.backgroundPosition = "center"; 
                ReplaceImageButton.style.backgroundSize = "contain";
                ReplaceImageButton.innerHTML = "";
                ImagesToReplace.find(i=>i.imgId == r).replacementURL = reader.result;
                UpdateImageStore(ImagesToReplace, "ImagesToReplace");
            }
            reader.readAsDataURL(request.response);
        };
        request.send();
    } else
    if (e.srcElement.id.search("browseDialog") != -1)
    {
        var file = e.srcElement.files[0];
        var reader = new FileReader();
        reader.onloadend = function() {
            var rx = new RegExp("[A-Za-z]*", "g");
            var r = e.srcElement.id.replace(rx, "");
            var ReplaceImageButton = document.getElementById("ReplaceImageButton" + r);
            ReplaceImageButton.style.background = "url(" + reader.result + ")";
            ReplaceImageButton.style.backgroundRepeat = "no-repeat"; 
            ReplaceImageButton.style.backgroundPosition = "center"; 
            ReplaceImageButton.style.backgroundSize = "contain";
            ReplaceImageButton.innerHTML = "";
            ImagesToReplace.find(i=>i.imgId == r).replacementURL = reader.result;
            UpdateImageStore(ImagesToReplace, "ImagesToReplace");
        }
        reader.readAsDataURL(file);
    }
    FlashSaved();
}

function UpdateDefaultMatchSelections()
{
    PickedImageDetails.matchSrc = PickedImageDetails.imageElement.search(new RegExp("src\\s*=\\s*\"", "g")) != -1;
    if (!PickedImageDetails.matchSrc) PickedImageDetails.matchID = PickedImageDetails.imageElement.search(new RegExp("id\\s*=\\s*\"", "g")) != -1;
    if (!PickedImageDetails.matchSrc && !PickedImageDetails.matchID) PickedImageDetails.matchClass = PickedImageDetails.imageElement.search(new RegExp("class\\s*=\\s*\"", "g")) != -1;
    if (!PickedImageDetails.matchSrc && !PickedImageDetails.matchID && !PickedImageDetails.matchClass) PickedImageDetails.matchHref = PickedImageDetails.imageElement.search(new RegExp("href\\s*=\\s*\"", "g")) != -1;
}

function AddImage(e)
{
    alert("Select an image on the last active tab page to replace.");
    try
    {
        chrome.runtime.sendMessage({from: "replaceImageFromOptions"}, response=>{ return true;});
    }
    catch (e)
    {
        console.log(e);
    }
}

function ProcessImages()
{
    document.getElementById("AddImageRowButton").addEventListener("click", AddImage);
    document.getElementById("AddImageRowButton2").addEventListener("click", AddImage);
    var PickedElementToReplace = GetQueryVariable("imageElement");
    if (PickedElementToReplace != undefined)
    {
        var t = Math.round(GetQueryVariable("top"), 0);
        var l = Math.round(GetQueryVariable("left"), 0);
        var w = Math.round(GetQueryVariable("width"), 0);
        var h = Math.round(GetQueryVariable("height"), 0);
        var r = GetQueryVariable("pixelRatio");
        var iw = GetQueryVariable("imgWidth");
        var imgSrc = GetQueryVariable("screenImg");
        var useSrc = false;
        var replacementURL = "";
        var matchID = false;
        var matchClass = false;
        var matchHref = false;
        var matchSrc = false;
        var imgId = CreateUniqueID();
        PickedImageDetails = {imgId, imageElement: PickedElementToReplace, useSrc, replacementURL, t, l, w, h, r, iw, imgSrc, matchID, matchClass, matchSrc};
    }

    LoadImagesFromStorage(PickedElementToReplace, function(imageElement) { 
        if (ImageArrayJson!= "[]" && ImageArrayJson != "")
        {
            ImagesToReplace = JSON.parse(ImageArrayJson);
            for (var i = 0; i < ImagesToReplace.length; i++)
            {
                if (ImagesToReplace[i]["imageElement"] == imageElement)
                    break;
            }
            if (i == ImagesToReplace.length && imageElement != undefined)
            {
                UpdateDefaultMatchSelections();
                ImagesToReplace.splice(ImagesToReplace.length, 0, PickedImageDetails);
            }
        } else
        if (imageElement != undefined)
        {
            UpdateDefaultMatchSelections();
            ImagesToReplace = new Array(PickedImageDetails);
        }
        UpdateImageStore(ImagesToReplace, "ImagesToReplace");
        
        // ugly, but there is a weird behavior where the first time one of the images is loaded, it does not appear.  
        // refreshing the page consistently after a new images has been added allows rendering then...
        if (GetQueryVariable("imagesRendered") == undefined)
        {
            window.location = chrome.runtime.getURL('options.html?imagesRendered=true');
        }
        else
        {
            //removes display:none and sets bgcolor. this hides the refresh flash...
            document.body.style = "background:rgba(55, 126, 225,.55);"; 
        }

        ImgTable = document.getElementById("ImageList");

        if (ImagesToReplace.length == 0)
        {
            ImgTable.style.display = "none";
            document.getElementById("NoImagesText").style.display = "inline";
            document.getElementById("AfterImagesText").style.display = "none";
        }

        for (var i = 0; i < ImagesToReplace.length; i++)
        {
            var imgId = ImagesToReplace[i].imgId;
            ImgTable.insertRow(ImgTable.rows.length - 1);
            const RemoveInlineSrcData = /(src\s*=\s*\"data:.*?)\"(.*)/g;
            var scrubbedElement = ImagesToReplace[i].imageElement.replace(RemoveInlineSrcData, "src=\"<inline data>\"$2");
            const RemoveInlineSrcSetData = /(srcset\s*=\s*\".*?)\"/g;
            scrubbedElement = htmlEscape(scrubbedElement.replace(RemoveInlineSrcSetData, "")).replace("&lt;inline data&gt;", "<i>&lt;inline data&gt;</i>");
            
            ImgTable.rows[ImgTable.rows.length - 2].innerHTML = 
             "<td ><div id=\"imageCropDiv_" + imgId + "\"><img id=\"imageCanvas_" + imgId + "\"></img></div></td>" + 
             "<td style=\"max-width: 380px;word-wrap: break-word;font-size: x-small;\" id=\"htmlTag" + imgId + "\">" +  scrubbedElement + "</td>" +
             "<td style=\"border-left: 1px dashed gray\">" +
                (scrubbedElement.search(new RegExp("id\\s*=\\s*&quot;", "g")) == -1 ? "" : "<center><input type=\"checkbox\" id=\"matchId" + imgId + "\" name=\"matchId" + imgId + "\"></center>") + "</td>" +
             "<td style=\"border-left: 1px dashed gray\">" + 
                (scrubbedElement.search(new RegExp("class\\s*=\\s*&quot;", "g")) == -1 ? "" : "<center><input type=\"checkbox\" id=\"matchClass" + imgId + "\" name=\"matchClass" + imgId + "\"></center>") + "</td>" +
             "<td style=\"border-left: 1px dashed gray\">" + 
                (scrubbedElement.search(new RegExp("src\\s*=\\s*&quot;", "g")) == -1 ? "" : "<center><input type=\"checkbox\" id=\"matchSrc" + imgId + "\" name=\"matchSrc" + i + "\"></center>") + "</td>" +
             "<td style=\"border-left: 1px dashed gray\"><center>" +
                (scrubbedElement.search(new RegExp("href\\s*=\\s*&quot;", "g")) == -1 ? "" : "<input type=\"checkbox\" id=\"matchHref" + imgId + "\" name=\"matchHref" + imgId + "\"></center>") + "</td>" +
             "<td style=\"border-left: 1px dashed gray\" valign=center><center>" +
                "<div class=\"dropdown\" style='position:relative; top: 5px;'>\
                    <center>" +
                        "<button class=\"dropbtn\" id=\"ReplaceImageButton" + imgId + "\" \
                            style=\"width: " + (ThumbnailSize + 12) + "px; height: " + (ThumbnailSize + 12) + "px;" +
                            (ImagesToReplace[i].replacementURL == "" ? "" : "background: url(" + ImagesToReplace[i].replacementURL + ");background-repeat: no-repeat; background-position: center; background-size: contain;") +
                            "\">" +
                            (ImagesToReplace[i].replacementURL == "" ? "<b>remove: no new image</b>" : "") +
                        "</button>\
                    </center>\
                    <div style='border:3px solid gray;background-color:gray;opacity:50%;position:relative;top:-7px;'></div>\
                    <div class=\"arrow-down\" style=\"opacity: 60%;position: relative; top: -12px;\"></div>\
                    <div class=\"dropdown-content\" style=\"background-color: #9bc3f0;position:inline;top:55px;\">\
                        <table style=\"padding: 1px;\" class=\"dropTable\">\
                            <tr>\
                                <td style=\"border-top: 0px;padding: 0px;position:relative;top:1px;\">\
                                    <button class=\"dropimg\" style=\"width: " + (ThumbnailSize + 12) + "px; height: " + (ThumbnailSize + 12) + "px;\" id=\"btnNoImg" + imgId + "\">\
                                    <b>remove: no new image</b></button>\
                                </td>\
                                <td style=\"border-top: 0px;padding: 0px;\">\
                                    <button class=\"dropimg\" style=\"position:relative;top:1px;background: url(./images/avatarmenu_defaultavatarsmall.png);width: " + (ThumbnailSize + 12) + "px; height: " + (ThumbnailSize + 12) + "px;background-repeat: no-repeat; background-position: center; background-size: cover;\" id=\"btnDefaultImg" + imgId + "\"/>\
                                </td>\
                                <td style=\"border-top: 0px;padding: 0px;position:relative;top:1px;\">\
                                    <button class=\"dropimg\" style=\"color: white;width: " + (ThumbnailSize + 12) + "px; height: " + (ThumbnailSize + 12) + "px;\" id=\"btnBrowse" + imgId + "\">\
                                    <b style='font-size:large'><input style='visibility:hidden;' accept='image/*' type=\"file\" id=\"browseDialog" + imgId + "\">...</b>\
                                    </button>\
                                </td>\
                            </tr>\
                        </table>\
                    </div>\
                </div>" +
                "<center></td>" +
             "<td style=\"\"><img class=\"AddRemoveRowButtons\" valign=bottom src=\"./images/minus.png\" id=\"deleteImg" + imgId + "\"></td>";

            var id = document.getElementById("matchId" + imgId);
            var href = document.getElementById("matchHref" + imgId);
            var src = document.getElementById("matchSrc" + imgId);
            var cls = document.getElementById("matchClass" + imgId);
            var del = document.getElementById("deleteImg" + imgId);

            var browseBtn = document.getElementById("btnBrowse" + imgId);
            var browseDialog = document.getElementById("browseDialog" + imgId);
            var noimg = document.getElementById("btnNoImg" + imgId);
            var defaultimg = document.getElementById("btnDefaultImg" + imgId);
            
            browseDialog.addEventListener("change", ImageSelected);
            browseBtn.addEventListener("click", function (e) { 
                if (e.isTrusted)
                {
                    var rx = new RegExp("[A-Za-z]*", "g");
                    var r = document.elementFromPoint(e.clientX, e.clientY).parentNode.id.replace(rx, "");
                    console.log(r)
                    var bd = document.getElementById("browseDialog" + r);
                    if (bd != null)
                        bd.click();
                }
            });
            defaultimg.addEventListener("click", ImageSelected);
            noimg.addEventListener("click", ImageSelected);        

            del.addEventListener("click", DelImg);
            
            if (id != null && ImagesToReplace[i].matchID) id.checked = true;
            if (src != null && ImagesToReplace[i].matchSrc) src.checked = true;
            if (href != null && ImagesToReplace[i].matchHref) href.checked = true;
            if (cls != null && ImagesToReplace[i].matchClass) cls.checked = true;

            if (id != null) id.addEventListener("change", BoldTag);
            if (href != null) href.addEventListener("change", BoldTag);
            if (src != null) src.addEventListener("change", BoldTag);
            if (cls != null) cls.addEventListener("change", BoldTag);
            
            BoldTag(imgId);
            
            var imageCropDiv = document.getElementById("imageCropDiv_" + imgId);
            var imageCanvas = document.getElementById("imageCanvas_" + imgId);
            var t = ImagesToReplace[i].t;
            var l = ImagesToReplace[i].l;
            var w = ImagesToReplace[i].w;
            var h = ImagesToReplace[i].h;
            var r = ImagesToReplace[i].r;
            var imgWidth = ImagesToReplace[i].iw;
            var imgSrc = ImagesToReplace[i].imgSrc;
            var useSrc = false;
            var replacementURL = "";

            if (imgSrc != undefined) 
            {
                imageCanvas.src = imgSrc;
                imageCanvas.width = Math.round(imageCanvas.width / r * (ThumbnailSize / w));  
                imageCanvas.style = "margin: -" + Math.round(t * (ThumbnailSize/w)) + "px 0 0 -" + Math.round(l * (ThumbnailSize/w))+ "px;"; 
                imageCropDiv.style = "width: " + ThumbnailSize + "px;height: " + ThumbnailSize/w * h + "px;border: 2px solid gray;border-radius: 3px;overflow: hidden;";  
                
            }
        }
        if (ImagesToReplace.length > 0) 
            document.getElementById("AfterImagesText").style.display = "inline";

        PageLoading = false;
    });
}