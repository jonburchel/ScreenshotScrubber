let AddRowButton = document.getElementById("AddRowButton");
AddRowButton.addEventListener("click", AddRow);
window.addEventListener("unload", StoreConfigValues);
document.getElementById("Original0").addEventListener("focusout", StoreConfigValues);
document.getElementById("Original0").addEventListener("input", function(e) { DataChanged(e); });
document.getElementById("New0").addEventListener("focusout", StoreConfigValues);
document.getElementById("New0").addEventListener("input", function(e) { DataChanged(e); });
document.getElementById("Delete0").addEventListener("click", function(e) { DeleteRow(e); });

var typingTimer;
var doneTypingInterval = 600; // wait 600ms after typing stops to save changed values...
function doneTyping()
{
    StoreConfigValues();
}

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
        const maxLength = chrome.storage.sync.QUOTA_BYTES_PER_ITEM - index.length - 200;
        var valueLength = jsonstr.length;
        if(valueLength > maxLength){
            valueLength = maxLength;
        }

        // trim down segment so it will be small enough even when run through `JSON.stringify` again at storage time
        //max try is QUOTA_BYTES_PER_ITEM to avoid infinite loop
        var segment = jsonstr.substr(0, valueLength); 
        for(let i = 0; i < chrome.storage.sync.QUOTA_BYTES_PER_ITEM; i++){
            const jsonLength = JSON.stringify(segment).length;
            if(jsonLength > maxLength){
                segment = jsonstr.substr(0, --valueLength);
            }else {
                break;
            }
        }

        storageObj[index] = segment;
        chrome.storage.sync.set({[index]: storageObj[index]});
        jsonstr = jsonstr.substr(valueLength);
    }
    
    chrome.storage.sync.set({ImageStoreLength: i});
}


var ImgData = "";

function readStorage (key) {
    return new Promise((resolve) => {
        chrome.storage.sync.get(key, function (result) {    
            if (result[key] === undefined) {
                resolve(undefined);
              } else {
                ImgData += result[key];
                resolve(result[key]);
              }
              
        });
    });
}

function getImageStore(callback) {
    chrome.storage.sync.get("ImageStoreLength", async function (StoreLen){
        for (var StoreItem = 0; StoreItem < StoreLen.ImageStoreLength; StoreItem++)
        {
            var key = "ImageStore_" + StoreItem.toString();
            await readStorage(key);
        }
        console.log(JSON.parse(ImgData));
    });
}

if (getQueryVariable("imageElement") != "")
{
    var imageElement = getQueryVariable("imageElement");
    var t = Math.round(getQueryVariable("top"), 0);
    var l = Math.round(getQueryVariable("left"), 0);
    var w = Math.round(getQueryVariable("width"), 0);
    var h = Math.round(getQueryVariable("height"), 0);
    var r = getQueryVariable("pixelRatio");
    var imgSrc = getQueryVariable("screenImg");
    var imgDetails = {imageElement, t, l, w, h, r, imgSrc};

    var ReplaceImgValues = null;
    getImageStore(function(ia) { 
        if (false)//ia.ImageStore != undefined)
        {
            ReplaceImgValues = ia.ImageStore;
            ReplaceImgValues.splice(ReplaceImgValues.length - 1, 0, imgDetails);
        }
        else
        {
            ReplaceImgValues = new Array(imgDetails);
        }
        
        updateImageStore(ReplaceImgValues);
    });
}


// document.getElementById("element").innerText = getQueryVariable("element");
// var img = document.getElementById("imageCanvas");
// img.src = 
// img.width = img.width / r;
// img.style = "margin: -" + ( t) + "px 0 0 -" + (l) + "px;";
// document.getElementById("imageCropDiv").style = "width: " + (w) + "px; height: " + (h) + "px; border:2px solid red;overflow: hidden;";

chrome.storage.sync.get("ConfigArray", function(ca) { 
    var DefaultSettings = null;
    if (ca.ConfigArray == null)
    {
        DefaultSettings = new Array(5);
        DefaultSettings[0] = ["Microsoft", "Contoso, Ltd."];
        DefaultSettings[1] = ["<your subscription id>", "abcdef01-2345-6789-0abc-def012345678"];
        DefaultSettings[2] = ["<your name>", "Chris Q. Public"];
        DefaultSettings[3] = ["<youralias@microsoft.com>", "chrisqpublic@contoso.com"];
        DefaultSettings[4] = ["img.fxs-avatarmenu-tenant-image", "https://portal.azure.com/Content/static/MsPortalImpl/AvatarMenu/AvatarMenu_defaultAvatarSmall.png"];
        chrome.storage.sync.set({ConfigArray: DefaultSettings});
    }
    else
    {
        DefaultSettings = ca.ConfigArray;
    }
    document.getElementById("Original0").value = DefaultSettings[0][0];
    document.getElementById("New0").value = DefaultSettings[0][1];
    for (var i = 1; i < DefaultSettings.length; i++)
    {
        AddRow();
        if (DefaultSettings[i][0].startsWith("img.") && DefaultSettings[i][1].startsWith("http"))
            SettingsList.rows[i + 1].cells[0].innerHTML = "<img src='images/image.png' valign='bottom'></img>";
        SettingsList.rows[i + 1].cells[1].children[0].value = DefaultSettings[i][0];
        SettingsList.rows[i + 1].cells[2].children[0].value = DefaultSettings[i][1];
    }
    AddRowButton.hidden = false;    
});

function CreateGUID() 
{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

function AddRow()
{
    var row = SettingsList.insertRow(SettingsList.rows.length - 2);
    var id = CreateGUID();
    row.id = "Row" + id;
    var cell0 = row.insertCell(0);
    var cell1 = row.insertCell(1);
    var cell2 = row.insertCell(2);
    var cell3 = row.insertCell(3);
    cell1.innerHTML="<input type=\"text\" id=\"Original" + id + "\" size=35></input>";
    cell2.innerHTML="<input type=\"text\" id=\"New" + id + "\" size=35></input>";
    cell3.innerHTML="<img valign=bottom src=\"./images/minus.png\" id=\"Delete" + id + "\">";
    cell1.addEventListener("input", function(e) { DataChanged(e); });
    cell2.addEventListener("input", function(e) { DataChanged(e); });
    document.getElementById("Original" + id).addEventListener("focusout", StoreConfigValues);
    document.getElementById("New" + id).addEventListener("focusout", StoreConfigValues);
    let DeleteRowButton = document.getElementById("Delete" + id);
    DeleteRowButton.addEventListener("click", function(e) { DeleteRow(e); });
    AddRowButton.hidden = true;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function StoreConfigValues()
{
    AddRowButton.hidden = false;
    var ReplaceValues = new Array(SettingsList.rows.length - 3);
    for (var i = 0; i < ReplaceValues.length; i++)
    {
        ReplaceValues[i] = [SettingsList.rows[i + 1].cells[1].children[0].value, SettingsList.rows[i + 1].cells[2].children[0].value];
        if (ReplaceValues[i][0].startsWith("img.") && ReplaceValues[i][1].startsWith("http"))
                SettingsList.rows[i + 1].cells[0].innerHTML = "<img src='images/image.png' valign='bottom'></img>";
        else
            SettingsList.rows[i + 1].cells[0].innerHTML = "";
    }
    chrome.storage.sync.set({ConfigArray: ReplaceValues});
    var SavedDiv = document.getElementById("SavedDiv");
    SavedDiv.style.opacity = "100%";
    await sleep(250);
    for (var i = 100; i >= 0; i-=2)
    {
        SavedDiv.style.opacity = (i / 100);
        await sleep(1);
    }
}

function DataChanged(e)
{
    var id = e.target.id.replace('Original', '').replace('New', '');
    var ValueType = e.target.id.replace(id, '');
    let OriginalValue = document.getElementById("Original" + id);
    let NewValue = document.getElementById("New" + id);
    let DeleteRowButton = document.getElementById("Delete" + id);
    var i = 0;
    for (i = 1; i < SettingsList.rows.length - 3; i++) 
    {
        if(SettingsList.rows[i].cells[1].children[0].value.trim() == "" || SettingsList.rows[i].cells[2].children[0].value.trim() == "")
        {
            AddRowButton.hidden = true;
            break;
        }
    }
    if (i == SettingsList.rows.length - 3)
    {    
        clearTimeout(typingTimer);
        typingTimer = setTimeout(doneTyping, doneTypingInterval);
    }
}

function DeleteRow(e)
{
    var id = e.target.id.replace('Delete', '');
    SettingsList.deleteRow(document.getElementById("Row" + id).rowIndex);
    AddRowButton.hidden = false;
    StoreConfigValues();
}