let AddRowButton = document.getElementById("AddRowButton");
AddRowButton.addEventListener("click", AddRow);
document.getElementById("Original0").addEventListener("input", function(e) { DataChanged(e); });
document.getElementById("New0").addEventListener("input", function(e) { DataChanged(e); });
document.getElementById("Delete0").addEventListener("click", function(e) { DeleteRow(e); });
document.getElementById("CaseSensitive0").addEventListener("change", StoreConfigValues);

document.getElementById("ImportBtn").addEventListener("click", function()
{
    document.getElementById("ImportSettingsFile").click();
    
});
document.getElementById("ExportBtn").addEventListener("click", function()
{
    if (ImageArrayJson!= "[]" && ImageArrayJson != "")
    {
        chrome.storage.sync.get("ConfigArray", function(ca) { 
            var element = document.createElement('a');
            element.setAttribute('href','data:application/xml;charset=utf-8,' + JSON.stringify(ca) + '\r\nScreenshotScrubberImages:\r\n' + encodeURIComponent(ImageArrayJson));
            element.setAttribute('download', "ScreenshotScrubberSettings.json");
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        });
    }
});
document.getElementById("ImportSettingsFile").addEventListener("change", function() {
    var file = this.files[0];
    if (file)
    {
        file.text().then(function(text){
            var SettingsText = text.substring(0, text.indexOf("\r\nScreenshotScrubberImages:\r\n"));
            var ImagesText = text.substring(text.indexOf("\r\nScreenshotScrubberImages:\r\n") + "\r\nScreenshotScrubberImages:\r\n".length);
            
            var Settings = JSON.parse(SettingsText).ConfigArray;
            for (var i = 1; i < SettingsList.rows.length - 2; i++)
            {
                if (Settings.findIndex(s=>s[0] == SettingsList.rows[i].cells[1].children[0].value) == -1)
                {
                    Settings.push([ SettingsList.rows[i].cells[1].children[0].value, 
                                    SettingsList.rows[i].cells[2].children[0].value, 
                                    SettingsList.rows[i].cells[3].children[0].checked ]);
                }
            }
            chrome.storage.sync.set({ConfigArray: Settings});
            
            var Images = JSON.parse(ImagesText);
            for (var i = 0; i < ImagesToReplace.length; i++)
            {
                if (Images.findIndex(img => img.imgId == ImagesToReplace[i].imgId) == -1)
                {                  
                    Images.push({imgId: ImagesToReplace[i].imgId, imageElement: ImagesToReplace[i].imageElement, useSrc: ImagesToReplace[i].useSrc, replacementURL: ImagesToReplace[i].replacementURL, 
                        t: ImagesToReplace[i].t, l: ImagesToReplace[i].l, w: ImagesToReplace[i].w, h: ImagesToReplace[i].h, r: ImagesToReplace[i].r, iw: ImagesToReplace[i].iw, 
                        imgSrc: ImagesToReplace[i].imgSrc, matchID: ImagesToReplace[i].matchID, matchClass: ImagesToReplace[i].matchClass, matchSrc: ImagesToReplace[i].matchSrc});
                }
            }
            UpdateImageStore(Images, "ImagesToReplace")
            document.location.reload();
        });
    }
})

var typingTimer;
var doneTypingInterval = 500; // wait 500ms after typing stops to save changed values...
function doneTyping()
{
    StoreConfigValues();
}

chrome.storage.sync.get("ConfigArray", function(ca) { 
    var DefaultSettings = null;
    if (ca.ConfigArray == null)
    {
        DefaultSettings = new Array(3);
        DefaultSettings[0] = ["<your subscription id>", "abcdef01-2345-6789-0abc-def012345678", false];
        DefaultSettings[1] = ["<your name>", "Chris Q. Public", false];
        DefaultSettings[2] = ["<youralias@microsoft.com>", "chrisqpublic@contoso.com", false];
        chrome.storage.sync.set({ConfigArray: DefaultSettings});
    }
    else
    {
        DefaultSettings = ca.ConfigArray;
    }
    document.getElementById("Original0").value = DefaultSettings[0][0];
    document.getElementById("New0").value = DefaultSettings[0][1];
    document.getElementById("CaseSensitive0").checked = DefaultSettings[0][2];
    for (var i = 1; i < DefaultSettings.length; i++)
    {
        AddRow();
        SettingsList.rows[i + 1].cells[1].children[0].value = DefaultSettings[i][0];
        SettingsList.rows[i + 1].cells[2].children[0].value = DefaultSettings[i][1];
        SettingsList.rows[i + 1].cells[3].children[0].checked = DefaultSettings[i][2];
    }
    AddRowButton.hidden = false;
});

function CreateUniqueID(numDigits = 6) 
{
    var s = "";
    for (var i = 0; i < numDigits; i++)
        s += Math.round(Math.random() * 9.5 - .5);
    return s;
}

function AddRow()
{
    var row = SettingsList.insertRow(SettingsList.rows.length - 2);
    var id = CreateUniqueID();
    row.id = "Row" + id;
    var cell0 = row.insertCell(0);
    var cell1 = row.insertCell(1);
    var cell2 = row.insertCell(2);
    var cell3 = row.insertCell(3);
    var cell4 = row.insertCell(4);
    cell1.innerHTML="<input type=\"text\" id=\"Original" + id + "\" size=35></input>";
    cell2.innerHTML="<input type=\"text\" id=\"New" + id + "\" size=35></input>";
    cell3.innerHTML="<center><input type=\"checkbox\" id=\"CaseSensitive" + id + "\"></center></input>";
    cell4.innerHTML="<img class=\"AddRemoveRowButtons\" valign=bottom src=\"./images/minus.png\" id=\"Delete" + id + "\">";
    cell1.addEventListener("input", function(e) { DataChanged(e); });
    cell2.addEventListener("input", function(e) { DataChanged(e); });
    cell3.addEventListener("change", StoreConfigValues);
    let DeleteRowButton = document.getElementById("Delete" + id);
    DeleteRowButton.addEventListener("click", function(e) { DeleteRow(e); });
    AddRowButton.hidden = true;
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function FlashSaved()
{
    var SavedDiv = document.getElementById("SavedDiv");
    SavedDiv.style.opacity = "100%";
    await sleep(500);
    for (var i = 100; i >= 0; i-=1)
    {
        SavedDiv.style.opacity = (i / 100);
        await sleep(1);
    }
}

function StoreConfigValues()
{
    AddRowButton.hidden = false;
    var ReplaceValues = new Array(SettingsList.rows.length - 3);
    for (var i = 0; i < ReplaceValues.length; i++)
    {
        ReplaceValues[i] = [SettingsList.rows[i + 1].cells[1].children[0].value, 
                            SettingsList.rows[i + 1].cells[2].children[0].value, 
                            SettingsList.rows[i + 1].cells[3].children[0].checked];
    }
    // Ensure replacement values that are contained in other replacement values are replaced only after the other replacement values are replaced.
    for (var i = 0; i < ReplaceValues.length; i++)
    {
        var newIndex = ReplaceValues.findIndex(e=> e[0].toLowerCase().includes(ReplaceValues[i][0].toLowerCase()) && e[0] != ReplaceValues[i][0]);
        if (newIndex > i)
        {
            var old = ReplaceValues[i];
            ReplaceValues[i] = ReplaceValues[newIndex]
            ReplaceValues[newIndex] = old;
        }
    }
    chrome.storage.sync.set({ConfigArray: ReplaceValues});
    FlashSaved();
}

function DataChanged(e)
{
    var id = e.target.id.replace('Original', '').replace('New', '');
    var ValueType = e.target.id.replace(id, '');
    let OriginalValue = document.getElementById("Original" + id);
    let NewValue = document.getElementById("New" + id);
    let DeleteRowButton = document.getElementById("Delete" + id);
    let CaseSensitive = document.getElementById("CaseSensitive" + id);
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