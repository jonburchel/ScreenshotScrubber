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
                }
                x = rect.left;
                y = rect.top;
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

function findAndReplace(searchText, replacement, searchNode) {
    var regex = new RegExp("((?<=>)[^<]*)(" + escapeRegex(searchText) + ")([^<]*)", 'g');
    try { 
        searchNode.innerHTML = searchNode.innerHTML.replace(regex, "$1" + replacement + "$3") 
    } catch(e) {} // ignore any errors caused by script replacement on the page
}


var mousePos = getSelectionCoords(window);
var elems = document.elementsFromPoint(mousePos.x, mousePos.y);
var foundCount = Array.from(document.body.innerHTML.matchAll(new RegExp(escapeRegex(document.getSelection().toString()), 'g'))).length;
var searchText = document.getSelection().toString();
var divDialog = document.body.insertBefore(document.createElement('div'), document.body.firstChild);
divDialog.style="position:absolute;z-index:2147483647;left:0;top:0;width:100%;height:100%;";
divDialog.className = "ScreenScrubberReplacePromptOverlay";
divDialog.id = divDialog.className;
divDialog.innerHTML = "<div style='border: solid gray 2px; position:absolute; top: " + ((window.innerHeight / 2) - 85) + "px; left: " + ((window.innerWidth / 2) - 200) + "px; width: 400px; height: 170px; background-color: cornflowerblue;'>\
    <table width=100% height=100%>\
        <tr style='border-bottom: solid gray 2px; height: 30px; font-size: large;'><td width=100% colspan=2>\
            &nbsp;<img width=24 style='position:relative; top:4px;' src='" + chrome.runtime.getURL("images/DocScreenshotScrubberIcon32.png") + "'/><b style='position:relative; top:-4px; left: 8px;'>Screenshot Scrubber - Replace Text</b></td></tr>\
        <tr style='height: 20px;'><td>&nbsp;&nbsp;<b>Search for:</b></td><td><input type=text style='padding: 0px; font-size:small;' size=45 id='ScreenshotScrubberSearchFor' value='" +  document.getSelection().toString() + "'/></td></tr>\
        <tr style='height: 20px;'><td>&nbsp;&nbsp;<b>Replace with:</b></td><td><input type=text style='padding: 0px; font-size:small;'' size=45 id='ScreenshotScrubberReplace'/></td></tr>\
        <tr><td colspan=2 style='text-align:right;'>" + 
            (foundCount <= 1 ? "" : "<b>Replace all " + foundCount + " occurrences:&nbsp;</b><input type=checkbox checked id='ScreenshotScrubberReplaceAll'/>&nbsp;&nbsp;<br>") +
            "<b>Save to default configuration:&nbsp;</b><input type=checkbox checked id='ScreenshotScrubberSaveToConfig' />&nbsp;&nbsp;\
        </td></tr>\
        <tr><td colspan=2 style='text-align:right;'>\
            <input type=button id=ScreenshotScrubberReplaceButton value=Replace style='width:70px'>\
            <input type=button id=ScreenshotScrubberCancelButton value=Cancel style='width:70px'>&nbsp;&nbsp;&nbsp;\
        </td></tr>\
    </table>\
</div>";
document.getElementById("ScreenshotScrubberCancelButton").addEventListener("click", ()=> {
    document.getElementById("ScreenScrubberReplacePromptOverlay").remove();
});
document.getElementById("ScreenshotScrubberReplaceButton").addEventListener("click", ()=> {
    var replaceAll = (document.getElementById("ScreenshotScrubberReplaceAll") == null ? false : document.getElementById("ScreenshotScrubberReplaceAll").checked);
    var replaceText = document.getElementById("ScreenshotScrubberReplace").value;
    var updateConfig = document.getElementById("ScreenshotScrubberSaveToConfig").checked;
    document.getElementById("ScreenScrubberReplacePromptOverlay").remove();
    if(updateConfig) {
        chrome.storage.sync.get("ConfigArray", function(ca) {
            if (ca.ConfigArray == null)
            {
                var DefaultSettings = new Array(5);
                DefaultSettings[0] = ["Microsoft", "Contoso, Ltd."];
                DefaultSettings[1] = ["<your subscription id>", "abcdef01-2345-6789-0abc-def012345678"];
                DefaultSettings[2] = ["<your name>", "Chris Q. Public"];
                DefaultSettings[3] = ["<youralias@microsoft.com>", "chrisqpublic@contoso.com"];
                DefaultSettings[4] = [searchText, replaceText];
                chrome.storage.sync.set({ConfigArray: DefaultSettings});
            }
            else
            ca.ConfigArray.push([searchText, replaceText]);
            chrome.storage.sync.set({ConfigArray: ca.ConfigArray});
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
