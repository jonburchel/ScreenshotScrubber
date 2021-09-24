let AddRowButton = document.getElementById("AddRowButton");
AddRowButton.addEventListener("click", AddRow);
window.addEventListener("unload", StoreConfigValues);
//document.getElementById("Original0").addEventListener("focusout", StoreConfigValues);
document.getElementById("Original0").addEventListener("input", function(e) { DataChanged(e); });
//document.getElementById("New0").addEventListener("focusout", StoreConfigValues);
document.getElementById("New0").addEventListener("input", function(e) { DataChanged(e); });
document.getElementById("Delete0").addEventListener("click", function(e) { DeleteRow(e); });

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
        DefaultSettings = new Array(4);
        DefaultSettings[0] = ["Microsoft", "Contoso, Ltd."];
        DefaultSettings[1] = ["<your subscription id>", "abcdef01-2345-6789-0abc-def012345678"];
        DefaultSettings[2] = ["<your name>", "Chris Q. Public"];
        DefaultSettings[3] = ["<youralias@microsoft.com>", "chrisqpublic@contoso.com"];
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
        SettingsList.rows[i + 1].cells[1].children[0].value = DefaultSettings[i][0];
        SettingsList.rows[i + 1].cells[2].children[0].value = DefaultSettings[i][1];
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
    cell1.innerHTML="<input type=\"text\" id=\"Original" + id + "\" size=35></input>";
    cell2.innerHTML="<input type=\"text\" id=\"New" + id + "\" size=35></input>";
    cell3.innerHTML="<img valign=bottom src=\"./images/minus.png\" id=\"Delete" + id + "\">";
    cell1.addEventListener("input", function(e) { DataChanged(e); });
    cell2.addEventListener("input", function(e) { DataChanged(e); });
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
    await sleep(250);
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
        ReplaceValues[i] = [SettingsList.rows[i + 1].cells[1].children[0].value, SettingsList.rows[i + 1].cells[2].children[0].value];
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