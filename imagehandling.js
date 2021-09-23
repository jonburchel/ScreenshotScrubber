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
                ReplaceImgValues.splice(ReplaceImgValues.length - 1, 0, imgDetails);
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

        var ImgList = document.getElementById("ImageList");
        ImgList.innerHTML = "";
        for (var i = 0; i < ReplaceImgValues.length; i++)
        {
            ImgList.insertRow();
            ImgList.rows[ImgList.rows.length - 1].innerHTML = "<td><div id=\"imageCropDiv_" + i + "\"><img id=\"imageCanvas_" + i + "\"></img></div><td>"
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
            
            if (imgSrc != undefined) 
            {
                imageCanvas.src = imgSrc;
                imageCanvas.width = Math.round(imageCanvas.width / r);  
                imageCanvas.style = "margin: -" + t + "px 0 0 -" + l + "px;"; 
                imageCropDiv.style = "width: " + w + "px;height: " + h + "px;border: 2px solid red;overflow: hidden;";  
            }
        }

    });
}



// document.getElementById("element").innerText = getQueryVariable("element");
// var img = document.getElementById("imageCanvas");
// img.src = 
// img.width = img.width / r;
// img.style = "margin: -" + ( t) + "px 0 0 -" + (l) + "px;";
// document.getElementById("imageCropDiv").style = "width: " + (w) + "px; height: " + (h) + "px; border:2px solid red;overflow: hidden;";
