function getSelectionCoords(win) {
    win = win || window;
    var doc = win.document;
    var sel = doc.selection, range, rects, rect;
    var x = 0, y = 0;
    if (sel) {
        if (sel.type != "Control") {
            range = sel.createRange();
            range.collapse(true);
            x = range.boundingLeft;
            y = range.boundingTop;
        }
    } else if (win.getSelection) {
        sel = win.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0).cloneRange();
            if (range.getClientRects) {
                range.collapse(true);
                rects = range.getClientRects();
                if (rects.length > 0) {
                    rect = rects[0];
                    x = rect.left;
                    y = rect.top;
                }            
            }
            // Fall back to inserting a temporary element
            if (x == 0 && y == 0) {
                var span = doc.createElement("span");
                if (span.getClientRects) {
                    // Ensure span has dimensions and position by
                    // adding a zero-width space character
                    span.appendChild( doc.createTextNode("\u200b") );
                    range.insertNode(span);
                    rect = span.getClientRects()[0];
                    x = rect.left;
                    y = rect.top;
                    var spanParent = span.parentNode;
                    spanParent.removeChild(span);

                    // Glue any broken text nodes back together
                    spanParent.normalize();
                }
            }
        }
    }
    return { x: x, y: y };
}

function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function htmlEscape(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function findAndReplace(searchText, replacement, searchNode) {
    var regex = new RegExp("((?<=>)[^<]*)(" + escapeRegex(searchText) + ")([^<]*)", 'g');
    try { 
        searchNode.innerHTML = searchNode.innerHTML.replace(regex, "$1" + replacement + "$3") 
    } catch(e) {} // ignore any errors caused by script replacement on the page
}

var link = document.createElement("link");
link.href = chrome.runtime.getURL("styles.css");
link.type = "text/css";
link.rel = "stylesheet";
document.getElementsByTagName("head")[0].appendChild(link);

var mousePos = getSelectionCoords(window);
var elems = document.elementsFromPoint(mousePos.x, mousePos.y);
var searchText = document.getSelection().toString().trim();
var foundCount = Array.from(document.body.innerHTML.matchAll(new RegExp(escapeRegex(searchText), 'g'))).length;
var divDialog = document.body.insertBefore(document.createElement('div'), document.body.firstChild);
divDialog.style="position:absolute;z-index:2147483647;left:0;top:0;width:100%;height:100%;";
divDialog.className = "ScreenScrubberReplacePromptOverlay";
divDialog.id = divDialog.className;
divDialog.innerHTML = "<div class='ScreenshotScrubberDialogStyle' id='divDialog' style='border: solid gray 2px; position:fixed; top: " + ((window.innerHeight / 2) - 85) + "px; left: " + ((window.innerWidth / 2) - 200) + "px;width: \
                                400px; height: 170px; border-radius: 6px; font-weight: 700;background: rgba(85, 126, 200,.75);backdrop-filter: blur(3px);'>\
    <table class='ScreenshotScrubberDialogStyle' width=100% height=100%>\
        <tr class='ScreenshotScrubberDialogStyle' id='ScreenshotScrubberDialogHeaderRow'  style='height: 30px; font-size: large;'>\
            <th class='ScreenshotScrubberDialogStyle' colspan=2 style='text-align:left; border-bottom: solid gray 2px;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
                &nbsp;<img class='ScreenshotScrubberDialogStyle' width=24 style='float:left;position:relative; top:4px;left: 3px;' src='" + chrome.runtime.getURL("images/DocScreenshotScrubberIcon32.png") + "'/>\
                <b style='position:relative; top:7px; left: 8px;'>Screenshot Scrubber - Replace Text</b>\
            </th></tr>\
        <tr class='ScreenshotScrubberDialogStyle' style='height: 20px;font-size:small;'>\
            <td class='ScreenshotScrubberDialogStyle' style='min-width: 0px;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
            &nbsp;&nbsp;<b>Search for:</b></td>\
            <td class='ScreenshotScrubberDialogStyle'>\
                <input class='ScreenshotScrubberDialogStyle' autocomplete='off' type=text \
                    style='width: 297px; margin-bottom: 5px; margin-top: 5px;border-width: 1px;padding: 0px; font-size:small;' \
                    size=45 id='ScreenshotScrubberSearchFor' value='" + searchText + "'/>\
            </td>\
        </tr>\
        <tr class='ScreenshotScrubberDialogStyle' style='height: 20px;font-size:small;'>\
            <td class='ScreenshotScrubberDialogStyle' style='min-width: 0px;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
            &nbsp;&nbsp;<b>Replace with:</b></td>\
            <td class='ScreenshotScrubberDialogStyle' style=''>\
                <input class='ScreenshotScrubberDialogStyle' autocomplete='off' type=text \
                    style='width: 297px; margin-bottom: 5px; margin-top: 5px;border-width: 1px;padding: 0px; font-size:small;'' \
                    size=45 id='ScreenshotScrubberReplace'/>\
            </td>\
        </tr>\
        <tr class='ScreenshotScrubberDialogStyle' ><td class='ScreenshotScrubberDialogStyle' colspan=2 style='text-align:right;font-size:small;'>\
            <div style='all:revert;' id='ScreenshotScrubberFoundCountDiv'>" + 
                (foundCount <= 1 || searchText == "" ? "<br>" : "<b style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>Replace all " + foundCount + " occurrences:&nbsp;</b>\
                 <input class='ScreenshotScrubberDialogStyle' type=checkbox checked id='ScreenshotScrubberReplaceAll'/>&nbsp;&nbsp;<br>") + 
            "</div>\
            <b style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>Save to default configuration:&nbsp;</b>\
                    <input class='ScreenshotScrubberDialogStyle' type=checkbox checked id='ScreenshotScrubberSaveToConfig' />&nbsp;&nbsp;\
        </td></tr>\
        <tr class='ScreenshotScrubberDialogStyle' height='100%' ><td class='ScreenshotScrubberDialogStyle' colspan=2 style='text-align:right;'>\
            <input class='ScreenshotScrubberDialogStyle' type=button id=ScreenshotScrubberReplaceButton value=Replace style='width:70px;background:cornflowerblue;color:white;'>\
            <input class='ScreenshotScrubberDialogStyle' type=button id=ScreenshotScrubberCancelButton value=Cancel style='width:70px;background:cornflowerblue;color:white;'>&nbsp;&nbsp;&nbsp;\
        </td></tr>\
    </table>\
</div>";

var DivOffset = [0,0];
function divMove(e)
{
        var div = document.getElementById('divDialog');
        div.style.position = 'fixed';
        div.style.top = ((e.clientY - DivOffset[1]) + 'px');
        div.style.left = ((e.clientX - DivOffset[0]) + 'px');
}

function mouseUp(e)
{
    window.removeEventListener('mousemove', divMove, true);
}

function mouseDown(e)
{
  DivOffset = [e.offsetX, e.offsetY];
  window.addEventListener('mousemove', divMove, true);
}



document.getElementById('ScreenshotScrubberDialogHeaderRow').addEventListener('mousedown', mouseDown, false);
window.addEventListener('mouseup', mouseUp, false);

document.getElementById("ScreenshotScrubberCancelButton").addEventListener("click", ()=> {
    document.removeEventListener("keydown", ProcessKeyDown, false);
    document.getElementById("ScreenScrubberReplacePromptOverlay").remove();
});

function ProcessKeyDown(kv)
{
    if (kv.keyCode == 27)
    {
        document.removeEventListener("keydown", ProcessKeyDown, false);
        document.getElementById("ScreenScrubberReplacePromptOverlay").remove();
    }
    if (kv.keyCode == 13)
        document.getElementById("ScreenshotScrubberReplaceButton").click();
}

document.addEventListener("keydown", ProcessKeyDown);

document.getElementById("ScreenshotScrubberSearchFor").addEventListener("input", ()=> {
    searchText = document.getElementById("ScreenshotScrubberSearchFor").value.trim();
    foundCount = Array.from(document.body.innerHTML.matchAll(new RegExp(escapeRegex(searchText), 'g'))).length;
    document.getElementById("ScreenshotScrubberFoundCountDiv").innerHTML = (foundCount <= 1 || searchText == "" ? "<br>" : "<b style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>Replace all " + foundCount + " occurrences:&nbsp;</b><input class='ScreenshotScrubberDialogStyle' type=checkbox checked id='ScreenshotScrubberReplaceAll'/>&nbsp;&nbsp;<br>");
});
var SearchFor = document.getElementById("ScreenshotScrubberSearchFor");
var ReplaceWith = document.getElementById("ScreenshotScrubberReplace");
if (SearchFor.value.trim() == "") 
    SearchFor.focus();
else
    ReplaceWith.focus();
document.getElementById("ScreenshotScrubberReplaceButton").addEventListener("click", ()=> {
    var replaceAll = (document.getElementById("ScreenshotScrubberReplaceAll") == null ? false : document.getElementById("ScreenshotScrubberReplaceAll").checked);
    var replaceText = document.getElementById("ScreenshotScrubberReplace").value;
    var updateConfig = document.getElementById("ScreenshotScrubberSaveToConfig").checked;
    document.getElementById("ScreenScrubberReplacePromptOverlay").remove();
    document.removeEventListener("keydown", ProcessKeyDown, false);
    if(updateConfig) {
        chrome.storage.sync.get("ConfigArray", function(ca) {
            console.log(ca);
            if (ca.ConfigArray == null)
            {
                var DefaultSettings = new Array(5);
                DefaultSettings[0] = ["Microsoft", "Contoso, Ltd."];
                DefaultSettings[1] = ["<your subscription id>", "abcdef01-2345-6789-0abc-def012345678"];
                DefaultSettings[2] = ["<your name>", "Chris Q. Public"];
                DefaultSettings[3] = ["<youralias@microsoft.com>", "chrisqpublic@contoso.com"];
                DefaultSettings[4] = [searchText, replaceText];
                chrome.storage.sync.set({ConfigArray: ca.ConfigArray});
            }
            else
            {
                ca.ConfigArray.push([searchText, replaceText]);
                chrome.storage.sync.set({ConfigArray: ca.ConfigArray}, ()=>{
                    chrome.runtime.sendMessage({ from: "replaceText" }, function(response) {});
                });
            }
        });
    }
    if (replaceAll)
        findAndReplace(searchText, replaceText, document.body);
    else
        for (var i = 0; i < elems.length; i++)
        {
            if (elems[i].innerHTML.search(replaceText) != 0);
            {
                elems[i].innerHTML = elems[i].innerHTML.replace(searchText, replaceText);
                i = elems.length;
            }
        }    
    
});
