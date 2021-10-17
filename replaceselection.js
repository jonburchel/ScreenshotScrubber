function getSelectionCoords(win) {
    win = win || window;
    var doc = win.document;
    var sel = doc.selection, range, rects, rect;
    var x = -1, y = -1;
    if (sel) {
        if (sel.type != "Control") {
            range = sel.createRange();
            range.collapse(true);
            x = range.boundingLeft;
            y = range.boundingTop;
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

function findAndReplace(searchText, replacement, searchNode, firstOnly = false) {
    var regex = new RegExp("((?<=>)[^<]*)(" + escapeRegex(searchText) + ")([^<]*)", firstOnly ? 'i' : 'g');
    try { 
        searchNode.innerHTML = searchNode.innerHTML.replace(regex, "$1" + replacement + "$3") 
    } catch(e) {} // ignore any errors caused by script replacement on the page
}

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
    if (e.path[0].tagName.toLowerCase() != "input")
    {
        var divDialog = document.getElementById("divDialog");
        var offsetY = e.clientY - divDialog.getBoundingClientRect().top;
        var offsetX = e.clientX - divDialog.getBoundingClientRect().left;
        DivOffset = [offsetX, offsetY];
        window.addEventListener('mousemove', divMove, true);
    }
}

function ProcessKeyDown(kv)
{
    if (kv.keyCode == 27)
    {
        try
        {
            document.removeEventListener("keydown", ProcessKeyDown, false);
            document.getElementById("ScreenScrubberReplacePromptOverlay").remove();
            var markInstance = new Mark(document.body);
            markInstance.unmark(()=>{});
        }
        catch(e)
        {} //ignore errors here and just quit
    }
    if (kv.keyCode == 13)
        document.getElementById("ScreenshotScrubberReplaceButton").click();
}

function ProcessMatch(elem)
{
    elem.style.backgroundColor = "yellow";
}

var typingTimer;
var doneTypingInterval = 150; // wait 150ms after typing stops to save changed values...
function doneTyping()
{
    HighlightText();
}

var foundCount = 0; 

function ExtraHighlightNextInstance()
{
    var matches = document.getElementsByClassName("ScreenshotScrubberHighlightedText");
    var searchText = document.getElementById("ScreenshotScrubberSearchFor").value.toLowerCase();
    if (searchText != "")
    {
        var iSelectedIndex = 1;
        if (!document.getElementById("ScreenshotScrubberSearchBackward").checked)
        {
            var extraHighlighted = false;
            var curMatchesString = "";
            for (var i = 0; i < matches.length; i++)
            {
                if (matches[i].style.backgroundColor == "orange")
                {
                    curMatchesString = "";
                    while (i < matches.length && matches[i].style.backgroundColor != "yellow")
                    {
                        matches[i].style.backgroundColor = "yellow";
                        i++;
                    }
                    curMatchesString = "";
                    while (i < matches.length && curMatchesString.toLowerCase() != searchText)
                    {
                        extraHighlighted = true;
                        matches[i].style.backgroundColor = "orange";
                        curMatchesString += matches[i].innerText;
                        i++;
                    }
                    if (i <= matches.length)
                        matches[i - 1].scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
                    i == matches.length;
                    iSelectedIndex++;
                }
                else
                {
                    curMatchesString += matches[i].innerText;
                    if (curMatchesString.toLowerCase() == searchText)
                    {
                        iSelectedIndex++;
                        curMatchesString = "";
                    }
                }
            }
            if (!extraHighlighted)
            {
                iSelectedIndex = 1;
                var i = 0;
                curMatchesString = "";
                while (i < matches.length && curMatchesString.toLowerCase() != searchText)
                {
                    curMatchesString += matches[i].innerText;
                    matches[i].style.backgroundColor = "orange";
                    i++;
                }
                if (matches.length > 0)
                    matches[i - 1].scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
            }
        }
        else
        {
            var extraHighlighted = false;
            var curMatchesString = "";
            iSelectedIndex = foundCount;
            for (var i = matches.length - 1; i >= 0; i--)
            {
                if (matches[i].style.backgroundColor == "orange")
                {
                    while (i >= 0 && matches[i].style.backgroundColor != "yellow")
                    {
                        matches[i].style.backgroundColor = "yellow";
                        i--;
                    }
                    curMatchesString = "";
                    while (i >= 0 && curMatchesString.toLowerCase() != searchText)
                    {
                        extraHighlighted = true;
                        matches[i].style.backgroundColor = "orange";
                        curMatchesString = matches[i].innerText + curMatchesString;
                        i--;
                    }
                    if (i >= -1) matches[i + 1].scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
                    i == 0;
                    iSelectedIndex--;
                }
                else
                {
                    curMatchesString = matches[i].innerText + curMatchesString;
                    if (curMatchesString.toLowerCase() == searchText)
                    {
                        iSelectedIndex--;
                        curMatchesString = "";
                    }
                }
            }
            if (!extraHighlighted)
            {
                iSelectedIndex = foundCount;
                var i = matches.length - 1;
                curMatchesString = "";
                while (i >= 0 && curMatchesString.toLowerCase() != searchText)
                {
                    curMatchesString = matches[i].innerText + curMatchesString;
                    matches[i].style.backgroundColor = "orange";
                    i--;
                }
                if (matches.length > i + 1)
                    matches[i + 1].scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
            }
        }
    }
    document.getElementById("ScreenshotScrubberFoundCountDiv").innerHTML = 
    (searchText == "" ? "<br>" : 
        (foundCount == 0 ? 
            "<span class='ignore' style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
            Found 0 occurrences.&nbsp;&nbsp;&nbsp;</span>" :
            "<span class='ignore' style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>" +
            iSelectedIndex + " of " + foundCount + " occurrence" + (foundCount == 1 ? "" : "s") + "&nbsp;&nbsp;&nbsp;</span>"
        )
    )
}

function UpdateButtonStates()
{
    document.getElementById("ScreenshotScrubberSkipButton").disabled = foundCount == 0;
    document.getElementById("ScreenshotScrubberReplaceButton").disabled = foundCount == 0;
    document.getElementById("ScreenshotScrubberReplaceAllButton").disabled = foundCount == 0;
    if (foundCount == 0)
    {
        document.getElementById("ScreenshotScrubberSkipButton").className = "ScreenshotScrubberDialogStyle ignore disabled";
        document.getElementById("ScreenshotScrubberReplaceButton").className = "ScreenshotScrubberDialogStyle ignore disabled";
        document.getElementById("ScreenshotScrubberReplaceAllButton").className = "ScreenshotScrubberDialogStyle ignore disabled";
    }
    else
    {
        document.getElementById("ScreenshotScrubberSkipButton").className = "ScreenshotScrubberDialogStyle ignore";
        document.getElementById("ScreenshotScrubberReplaceButton").className = "ScreenshotScrubberDialogStyle ignore";
        document.getElementById("ScreenshotScrubberReplaceAllButton").className = "ScreenshotScrubberDialogStyle ignore";
    }
}

function HighlightText()
{
    var s = document.getElementById("ScreenshotScrubberSearchFor").value;
    try
    {
        var markInstance = new Mark(document.body);
    }
    catch (e)
    {
        alert("The extension has been reloaded since this page was refreshed.  Please refresh the page and try again.");
        document.getElementById("ScreenScrubberReplacePromptOverlay").remove();
        return;
    }
    var highlightedNode = Array.from(document.getElementsByClassName("ScreenshotScrubberHighlightedText")).filter(elem=>elem.style.backgroundColor == "orange")[0];
    
    if (highlightedNode != undefined)
    {
        userSelectedNode = document.createRange();
        userSelectedNode.setStart(highlightedNode, 0);
        userSelectedNode.setEnd(highlightedNode, 0);
    }
    
    markInstance.unmark({
        done: function(){
            if (s.trim() != "")
            {
                markInstance.mark(s, {
                    each: ProcessMatch, 
                    accuracy: "partially",
                    className: "ScreenshotScrubberHighlightedText", 
                    caseSensitive: document.getElementById("ScreenshotScrubberCaseSensitivity").checked,
                    ignoreJoiners: true,
                    acrossElements: true,
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
                        if (count > 0)
                        {
                            var searchText = document.getElementById("ScreenshotScrubberSearchFor").value.toLowerCase();
                            var marks = document.getElementsByClassName("ScreenshotScrubberHighlightedText");
                            foundCount = 0;
                            var curMatchesString = ""
                            for (var i = 0; i < marks.length; i++)
                            {
                                curMatchesString += marks[i].innerText;
                                if (curMatchesString.toLowerCase() === searchText)
                                {
                                    foundCount++;
                                    curMatchesString = "";
                                }
                            }

                            // Add extra highlighting to the user selected text.
                            if (userSelectedNode != undefined)
                            {
                                var curSelectedText = ""
                                var curNode = userSelectedNode.startContainer;
                                if (document.getElementById("ScreenshotScrubberSearchBackward").checked)
                                {
                                    for (var i = marks.length - 1; i > 0; i--)
                                        if (curNode.compareDocumentPosition(marks[i]) == Node.DOCUMENT_POSITION_PRECEDING)
                                        {
                                            curNode = marks[i];
                                            i = 0;
                                        }
                                }
                                else
                                {
                                    for (var i = 0; i < marks.length; i++)
                                        if (curNode.compareDocumentPosition(marks[i]) == Node.DOCUMENT_POSITION_FOLLOWING)
                                        {
                                            curNode = marks[i];
                                            i = marks.length;
                                        }
                                }

                                if (curNode != null)
                                    curNode.id = "UserSelectedText";
                                var matches = document.getElementsByClassName("ScreenshotScrubberHighlightedText");
                                var selectedItemIndex = 0;
                                for (var i = 0; i < matches.length; i++)
                                {
                                    curSelectedText += matches[i].innerText;
                                    if (curSelectedText.toLowerCase() == searchText)
                                    {
                                        selectedItemIndex++;
                                        curSelectedText = "";
                                    }
                                    if (matches[i].id == "UserSelectedText")
                                    {
                                        if (matches[i].innerText.toLowerCase() != searchText)
                                            selectedItemIndex++;
                                        break;
                                    }
                                }
                                curSelectedText = "";

                                if (i >= matches.length) 
                                {
                                    i = 0;
                                    selectedItemIndex = 1;
                                }
                                matches[i].scrollIntoView({behavior:"smooth", block: "center", inline: "center"});
                                while (i < matches.length && curSelectedText.toLowerCase() != searchText)
                                {
                                    curSelectedText += matches[i].innerText;
                                    matches[i].style.backgroundColor = "orange";
                                    i++;
                                }
                                document.getElementById("ScreenshotScrubberFoundCountDiv").innerHTML = 
                                (searchText == "" ? "<br>" : 
                                    (foundCount == 0 ? 
                                        "<span class='ignore' style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
                                        Found 0 occurrences.&nbsp;&nbsp;&nbsp;</span>" :
                                        "<span class='ignore' style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>" +
                                        selectedItemIndex + " of " + foundCount + " occurrence" + (foundCount == 1 ? "" : "s") + "&nbsp;&nbsp;&nbsp;</span>"
                                    )
                                );
                            }
                            else
                                ExtraHighlightNextInstance();
                            UpdateButtonStates();
                        }
                        else
                        {
                            document.getElementById("ScreenshotScrubberFoundCountDiv").innerHTML = 
                                "<span class='ignore' style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
                                Found 0 occurrences.&nbsp;&nbsp;&nbsp;</span>";                   
                            foundCount = 0;
                            UpdateButtonStates();
                        }
                    }
                });
            }
            else
            {
                document.getElementById("ScreenshotScrubberFoundCountDiv").innerHTML = "<br>";                    
                foundCount = 0;
                UpdateButtonStates();
            }
        }
    });
}


function Replace() 
{
    var selectedItemIndex = 0;
    var searchText = document.getElementById("ScreenshotScrubberSearchFor").value.toLowerCase();
    var matches = document.getElementsByClassName("ScreenshotScrubberHighlightedText");
    var iMatchStart = 0;
    var curMatchString = "";
    for (var i = 0; i < matches.length; i++)
    {
        curMatchString += matches[i].innerText;
        if (curMatchString.toLowerCase() == searchText)
        {
            selectedItemIndex++;
            curMatchString = "";
        }
        if (matches[i].style.backgroundColor == "orange")
        {
            iMatchStart = i;
            i = matches.length;
        }
    }
    ExtraHighlightNextInstance();
    curMatchString = matches[iMatchStart].innerText.toLowerCase();
    if (document.getElementById("ScreenshotScrubberReplace").value.toLowerCase().lastIndexOf(searchText) == -1)
    {
        foundCount--;
        matches[iMatchStart].parentElement.replaceChild(document.createTextNode(document.getElementById("ScreenshotScrubberReplace").value), matches[iMatchStart]);
    }
    else
    {
        matches[iMatchStart].innerHTML = document.getElementById("ScreenshotScrubberReplace").value;
        matches[iMatchStart].style.backgroundColor = "yellow";
        iMatchStart++;
    }
    if (document.getElementById("ScreenshotScrubberSearchBackward").checked)
        selectedItemIndex--;
    if (selectedItemIndex == 0)
        selectedItemIndex = foundCount;
    if (selectedItemIndex > foundCount)
        selectedItemIndex = 1;
    while (curMatchString.toLowerCase() != searchText)
    {   
        curMatchString += matches[iMatchStart].innerText.toLowerCase();
        matches[iMatchStart].remove();
    }

    document.getElementById("ScreenshotScrubberFoundCountDiv").innerHTML = 
        (foundCount == 0 ? 
            "<span class='ignore' style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
            Found 0 occurrences.&nbsp;&nbsp;&nbsp;</span>" :
            "<span class='ignore' style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>" +
            selectedItemIndex + " of " + foundCount + " occurrence" + (foundCount == 1 ? "" : "s") + "&nbsp;&nbsp;&nbsp;</span>"
        );

    UpdateButtonStates();
}

var userSelectedNode = null;

if (document.getElementById("ScreenScrubberReplacePromptOverlay") == null && document.getElementById("ScreenScrubberPickerMsg") == null)
{
    var IsTextSelected = document.getSelection().toString().trim() == "";
    var link = document.createElement("link");
    link.href = chrome.runtime.getURL("styles.css");
    link.type = "text/css";
    link.rel = "stylesheet";
    document.getElementsByTagName("head")[0].appendChild(link);
    var mousePos = getSelectionCoords(window);
    var elems = document.elementsFromPoint(mousePos.x, mousePos.y);
    var searchText = document.getSelection().toString();
    if (searchText.trim() != "")
        userSelectedNode = document.getSelection().getRangeAt(0);

    var divDialog = document.body.insertBefore(document.createElement('div'), document.body.firstChild);
    divDialog.style="position:fixed;z-index:2147483647;left:0;top:0;width:100%;height:100%;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;";
    divDialog.className = "ScreenScrubberReplacePromptOverlay";
    divDialog.setAttribute("unselectable", "on");
    divDialog.id = divDialog.className;
    divDialog.innerHTML = "<div class='ScreenshotScrubberDialogStyle' id='divDialog' style='border: solid gray 2px; position:fixed; top: 20px; left: " + (window.innerWidth - 430) + "px;width: \
                                    400px; height: 190px; border-radius: 6px; font-weight: 300;background: rgba(85, 126, 200,.75);backdrop-filter: blur(2px);'>\
        <table class='ScreenshotScrubberDialogStyle' width=100% height=100% style='width: 400px;'>\
            <tr class='ScreenshotScrubberDialogStyle' id='ScreenshotScrubberDialogHeaderRow'  style='height: 30px; font-size: large;'>\
                <th class='ScreenshotScrubberDialogStyle' colspan=2 style='text-align:left; border-bottom: solid gray 2px;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
                    &nbsp;<img class='ScreenshotScrubberDialogStyle' width=24 unselectable='on' style='pointer-events:none;float:left;position:relative; top:-1px;left: 3px;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;' \
                    src='" + chrome.runtime.getURL("images/DocScreenshotScrubberIcon32.png") + "'/>\
                    <b class='ignore' style='position:relative; top:7px; left: 8px;'>Screenshot Scrubber - Replace Text</b>\
                </th></tr>\
            <tr class='ScreenshotScrubberDialogStyle' style='height: 20px;font-size:small;'>\
                <td class='ScreenshotScrubberDialogStyle' style='text-align:right;min-width: 0px;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
                &nbsp;&nbsp;<span class='ignore'>Search for:</span></td>\
                <td class='ScreenshotScrubberDialogStyle'>\
                    <input class='ScreenshotScrubberDialogStyle' autocomplete='off' type=text \
                        style='width: 297px; margin-bottom: 5px; margin-top: 5px;border-width: 1px;padding: 0px; font-size:small;' \
                        size=45 id='ScreenshotScrubberSearchFor' value='" + searchText + "'/>\
                </td>\
            </tr>\
            <tr class='ScreenshotScrubberDialogStyle' style='height: 20px;font-size:small;'>\
                <td class='ScreenshotScrubberDialogStyle' style='min-width: 0px;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
                &nbsp;&nbsp;<span class='ignore'>Replace with:</span></td>\
                <td class='ScreenshotScrubberDialogStyle' style=''>\
                    <input class='ScreenshotScrubberDialogStyle' autocomplete='off' type=text \
                        style='width: 297px; margin-bottom: 5px; margin-top: 5px;border-width: 1px;padding: 0px; font-size:small;'' \
                        size=45 id='ScreenshotScrubberReplace'/>\
                </td>\
            </tr>\
            <tr class='ScreenshotScrubberDialogStyle' ><td class='ScreenshotScrubberDialogStyle' colspan=2 style='text-align:right;font-size:small;'>\
                <div style='all:revert;position:relative;top:-2px;' id='ScreenshotScrubberFoundCountDiv' />" + 
                    (searchText == "" ? "<br>" : 
                    "<span class='ignore' style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
                    </span>") + "\
                </div>\
                <span class='ignore' style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
                Case sensitive:&nbsp;</span>\
                        <input class='ScreenshotScrubberDialogStyle' type=checkbox id='ScreenshotScrubberCaseSensitivity' />&nbsp;&nbsp;\
                <span class='ignore' style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
                Search backward:&nbsp;</span>\
                        <input class='ScreenshotScrubberDialogStyle' type=checkbox id='ScreenshotScrubberSearchBackward' />&nbsp;&nbsp;<br>\
                <span class='ignore' style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
                Save to default configuration on close:&nbsp;</span>\
                        <input class='ScreenshotScrubberDialogStyle' type=checkbox id='ScreenshotScrubberSaveToConfig' />&nbsp;&nbsp;\
            </td></tr>\
            <tr class='ScreenshotScrubberDialogStyle' height='100%' ><td class='ScreenshotScrubberDialogStyle' colspan=2 style='text-align:right;'>" +
                "<input class='ScreenshotScrubberDialogStyle ignore disabled' type=button id=ScreenshotScrubberSkipButton value='Next' disabled=true style='padding:0px;width:75px;background:cornflowerblue;color:white;'>" +        
                "<input class='ScreenshotScrubberDialogStyle ignore disabled' type=button id=ScreenshotScrubberReplaceButton value=Replace disabled=true style='padding:0px;width:75px;background:cornflowerblue;color:white;'>" +
                "<input class='ScreenshotScrubberDialogStyle ignore disabled' type=button id=ScreenshotScrubberReplaceAllButton value='Replace all' disabled=true style='padding:0px;width:75px;background:cornflowerblue;color:white;'>" +
                "<input class='ScreenshotScrubberDialogStyle ignore' type=button id=ScreenshotScrubberCloseButton value=Close style='padding:0px;width:75px;background:cornflowerblue;color:white;'>&nbsp;\
            </td></tr>\
        </table>\
    </div>";

    HighlightText(); 

    document.getElementById('divDialog').addEventListener('mousedown', mouseDown, false);
    window.addEventListener('mouseup', mouseUp, false);

    document.getElementById("ScreenshotScrubberSearchBackward").addEventListener("change", ()=>{
        if (document.getElementById("ScreenshotScrubberSearchBackward").checked)
            document.getElementById("ScreenshotScrubberSkipButton").value = "Previous";
        else
            document.getElementById("ScreenshotScrubberSkipButton").value = "Next";
    });

    document.getElementById("ScreenshotScrubberCaseSensitivity").addEventListener("change", ()=>{
        HighlightText();
    });

    document.getElementById("ScreenshotScrubberCloseButton").addEventListener("click", ()=> {
        document.removeEventListener("keydown", ProcessKeyDown, false);
        var markInstance = new Mark(document.body);
        markInstance.unmark(()=>{});
        if(document.getElementById("ScreenshotScrubberSaveToConfig").checked) {
            chrome.storage.sync.get("ConfigArray", function(ca) {
                if (ca.ConfigArray == null)
                {
                    var DefaultSettings = new Array(5);
                    DefaultSettings[0] = ["Microsoft", "Contoso, Ltd.", false];
                    DefaultSettings[1] = ["<your subscription id>", "abcdef01-2345-6789-0abc-def012345678", false];
                    DefaultSettings[2] = ["<your name>", "Chris Q. Public", false];
                    DefaultSettings[3] = ["<youralias@microsoft.com>", "chrisqpublic@contoso.com", false];
                    DefaultSettings[4] = [document.getElementById("ScreenshotScrubberSearchFor").value, 
                                          document.getElementById("ScreenshotScrubberReplace").value, 
                                          document.getElementById("ScreenshotScrubberCaseSensitivity").checked];
                    chrome.storage.sync.set({ConfigArray: ca.ConfigArray});
                }
                else
                {
                    ca.ConfigArray.push([document.getElementById("ScreenshotScrubberSearchFor").value, 
                                         document.getElementById("ScreenshotScrubberReplace").value, 
                                         document.getElementById("ScreenshotScrubberCaseSensitivity").checked]);
                    chrome.storage.sync.set({ConfigArray: ca.ConfigArray}, ()=>{
                        chrome.runtime.sendMessage({ from: "replaceText" }, function(response) {});
                    });
                }
                document.getElementById("ScreenScrubberReplacePromptOverlay").remove();
            });
        }
        else
            document.getElementById("ScreenScrubberReplacePromptOverlay").remove();
        
    });
    document.getElementById("ScreenshotScrubberSkipButton").addEventListener("click", ()=>{
        ExtraHighlightNextInstance();
    });
    document.getElementById("ScreenshotScrubberReplaceButton").addEventListener("click", Replace);
    document.getElementById("ScreenshotScrubberReplaceAllButton").addEventListener("click", ()=>{
        var iCountToReplace = foundCount;
        for (var i = 0; i < iCountToReplace; i++)
            Replace();
        alert(iCountToReplace + " replacements made.");
    });

    document.addEventListener("keydown", ProcessKeyDown);
   

    document.getElementById("ScreenshotScrubberSearchFor").addEventListener("input", ()=> { 
        clearTimeout(typingTimer);
        typingTimer = setTimeout(doneTyping, doneTypingInterval);
    });

    var SearchFor = document.getElementById("ScreenshotScrubberSearchFor");
    var ReplaceWith = document.getElementById("ScreenshotScrubberReplace");

    if (SearchFor.value.trim() == "") 
        SearchFor.focus();
    else
        ReplaceWith.focus();
}