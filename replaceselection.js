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
    DivOffset = [e.offsetX, e.offsetY];
    window.addEventListener('mousemove', divMove, true);
}

function ProcessKeyDown(kv)
{
    if (kv.keyCode == 27)
    {
        document.removeEventListener("keydown", ProcessKeyDown, false);
        document.getElementById("ScreenScrubberReplacePromptOverlay").remove();
        var markInstance = new Mark(document.body);
        markInstance.unmark(()=>{});
    }
    if (kv.keyCode == 13)
        document.getElementById("ScreenshotScrubberReplaceButton").click();
}

function ProcessMatch(elem)
{
    elem.style.backgroundColor = "yellow";
}

var typingTimer;
var doneTypingInterval = 30; // wait 500ms after typing stops to save changed values...
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
        var extraHighlighted = false;
        var curMatchesString;
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
                while (i < matches.length && curMatchesString.toLowerCase() != searchText.toLowerCase())
                {
                    
                    extraHighlighted = true;
                    matches[i].style.backgroundColor = "orange";
                    curMatchesString += matches[i].innerText;
                    i++;
                }
                matches[i - 1].scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
                i == matches.length;
            }
        }
        if (!extraHighlighted)
        {
            var i = 0;
            curMatchesString = "";
            while (i < matches.length && curMatchesString.toLowerCase() != searchText.toLowerCase())
            {
                curMatchesString += matches[i].innerText;
                matches[i].style.backgroundColor = "orange";
                i++;
            }
            if (matches.length > 0)
                matches[i - 1].scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
        }
    }
}

function HighlightText()
{
    var s = document.getElementById("ScreenshotScrubberSearchFor").value.toLowerCase();
    var markInstance = new Mark(document.body);
    markInstance.unmark({
        done: function(){
          markInstance.mark(s, {
                each: ProcessMatch, 
                accuracy: "partially",
                className: "ScreenshotScrubberHighlightedText", 
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
                    document.getElementById("ScreenshotScrubberFoundCountDiv").innerHTML = 
                    (searchText == "" ? "<br>" : 
                    "<b class='ignore' style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
                    Found " + foundCount + " occurrence" + (foundCount == 1 ? "" : "s") + ".&nbsp;&nbsp;&nbsp;</b>");

                    // Add extra highlighting to the user selected text.
                    if (userSelectedNode != undefined)
                    {
                        var curSelectedText = ""
                        var curNode = userSelectedNode.startContainer.nextSibling;
                        curNode.id = "UserSelectedText";
                        var matches = document.getElementsByClassName("ScreenshotScrubberHighlightedText");
                        for (var i = 0; i < matches.length; i++)
                        {
                            if (matches[i].id == "UserSelectedText")
                                break;
                        }
                        while (i < matches.length && curSelectedText.toLowerCase() != searchText)
                        {
                            curSelectedText += matches[i].innerText;
                            matches[i].style.backgroundColor = "orange";
                            i++;
                        }
                    }
                    else
                        ExtraHighlightNextInstance();

                }
        });
      }
    });
}

function Replace() 
{
    var matches = document.getElementsByClassName("ScreenshotScrubberHighlightedText");
    var iMatchStart = 0;
    for (var i = 0; i < matches.length; i++)
    {
        if (matches[i].style.backgroundColor == "orange")
        {
            iMatchStart = i;
            i = matches.length;
        }
    }
    ExtraHighlightNextInstance();
    var curMatchString = matches[iMatchStart].innerText.toLowerCase();
    if (document.getElementById("ScreenshotScrubberReplace").value.toLowerCase().lastIndexOf(document.getElementById("ScreenshotScrubberSearchFor").value.toLowerCase()) == -1)
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
    while (curMatchString != document.getElementById("ScreenshotScrubberSearchFor").value.toLowerCase())
    {   
        curMatchString += matches[iMatchStart].innerText.toLowerCase();
        matches[iMatchStart].remove();
    }

    document.getElementById("ScreenshotScrubberFoundCountDiv").innerHTML = 
        (searchText == "" ? "<br>" : 
        "<b class='ignore' style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
        Found " + foundCount + " occurrence" + (foundCount == 1 ? "" : "s") + ".&nbsp;&nbsp;&nbsp;</b>");
}

var userSelectedNode = null;

if (document.getElementById("ScreenScrubberReplacePromptOverlay") == null)
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
    divDialog.style="position:absolute;z-index:2147483647;left:0;top:0;width:100%;height:100%;";
    divDialog.className = "ScreenScrubberReplacePromptOverlay";
    divDialog.id = divDialog.className;
    divDialog.innerHTML = "<div class='ScreenshotScrubberDialogStyle' id='divDialog' style='border: solid gray 2px; position:fixed; top: " + ((window.innerHeight / 2) - 85) + "px; left: " + ((window.innerWidth / 2) - 200) + "px;width: \
                                    400px; height: 170px; border-radius: 6px; font-weight: 300;background: rgba(85, 126, 200,.75);backdrop-filter: blur(2px);'>\
        <table class='ScreenshotScrubberDialogStyle' width=100% height=100%>\
            <tr class='ScreenshotScrubberDialogStyle' id='ScreenshotScrubberDialogHeaderRow'  style='height: 30px; font-size: large;'>\
                <th class='ScreenshotScrubberDialogStyle' colspan=2 style='text-align:left; border-bottom: solid gray 2px;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
                    &nbsp;<img class='ScreenshotScrubberDialogStyle' width=24 style='float:left;position:relative; top:4px;left: 3px;' src='" + chrome.runtime.getURL("images/DocScreenshotScrubberIcon32.png") + "'/>\
                    <b class='ignore' style='position:relative; top:7px; left: 8px;'>Screenshot Scrubber - Replace Text</b>\
                </th></tr>\
            <tr class='ScreenshotScrubberDialogStyle' style='height: 20px;font-size:small;'>\
                <td class='ScreenshotScrubberDialogStyle' style='min-width: 0px;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
                &nbsp;&nbsp;<b class='ignore'>Search for:</b></td>\
                <td class='ScreenshotScrubberDialogStyle'>\
                    <input class='ScreenshotScrubberDialogStyle' autocomplete='off' type=text \
                        style='width: 297px; margin-bottom: 5px; margin-top: 5px;border-width: 1px;padding: 0px; font-size:small;' \
                        size=45 id='ScreenshotScrubberSearchFor' value='" + searchText + "'/>\
                </td>\
            </tr>\
            <tr class='ScreenshotScrubberDialogStyle' style='height: 20px;font-size:small;'>\
                <td class='ScreenshotScrubberDialogStyle' style='min-width: 0px;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
                &nbsp;&nbsp;<b class='ignore'>Replace with:</b></td>\
                <td class='ScreenshotScrubberDialogStyle' style=''>\
                    <input class='ScreenshotScrubberDialogStyle' autocomplete='off' type=text \
                        style='width: 297px; margin-bottom: 5px; margin-top: 5px;border-width: 1px;padding: 0px; font-size:small;'' \
                        size=45 id='ScreenshotScrubberReplace'/>\
                </td>\
            </tr>\
            <tr class='ScreenshotScrubberDialogStyle' ><td class='ScreenshotScrubberDialogStyle' colspan=2 style='text-align:right;font-size:small;'>\
                <div style='all:revert;' id='ScreenshotScrubberFoundCountDiv'>" + 
                    (searchText == "" ? "<br>" : 
                    "<b class='ignore' style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
                    Found " + foundCount + " occurrence" + (foundCount == 1 ? "" : "s") + ".&nbsp;&nbsp;&nbsp;</b>") + "\
                </div>\
                <b class='ignore' style='-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'>\
                Save to default configuration on close:&nbsp;</b>\
                        <input class='ScreenshotScrubberDialogStyle' type=checkbox checked id='ScreenshotScrubberSaveToConfig' />&nbsp;&nbsp;\
            </td></tr>\
            <tr class='ScreenshotScrubberDialogStyle' height='100%' ><td class='ScreenshotScrubberDialogStyle' colspan=2 style='text-align:right;'>" +
                "<input class='ScreenshotScrubberDialogStyle ignore' type=button id=ScreenshotScrubberSkipBackButton value='<' style='padding:0px;padding-bottom:3px;marin:0px;width:35px;background:cornflowerblue;color:white;'>" +    
                "<input class='ScreenshotScrubberDialogStyle ignore' type=button id=ScreenshotScrubberSkipButton value='>' style='padding:0px;padding-bottom:3px;marin:0px;width:35px;background:cornflowerblue;color:white;'>" +        
                "<input class='ScreenshotScrubberDialogStyle ignore' type=button id=ScreenshotScrubberReplaceButton value=Replace style='padding:0px;padding-bottom:3px;marin:0px;width:75px;background:cornflowerblue;color:white;'>" +
                "<input class='ScreenshotScrubberDialogStyle ignore' type=button id=ScreenshotScrubberReplaceAllButton value='Replace all' style='padding:0px;padding-bottom:3px;marin:0px;width:75px;background:cornflowerblue;color:white;'>" +
                "<input class='ScreenshotScrubberDialogStyle ignore' type=button id=ScreenshotScrubberCloseButton value=Close style='padding:0px;padding-bottom:3px;marin:0px;width:75px;background:cornflowerblue;color:white;'>&nbsp;\
            </td></tr>\
        </table>\
    </div>";

    HighlightText(); 

    document.getElementById('ScreenshotScrubberDialogHeaderRow').addEventListener('mousedown', mouseDown, false);
    window.addEventListener('mouseup', mouseUp, false);

    document.getElementById("ScreenshotScrubberCloseButton").addEventListener("click", ()=> {
        document.removeEventListener("keydown", ProcessKeyDown, false);
        document.getElementById("ScreenScrubberReplacePromptOverlay").remove();
        var markInstance = new Mark(document.body);
        markInstance.unmark(()=>{});
        if(updateConfig) {
            chrome.storage.sync.get("ConfigArray", function(ca) {
                if (ca.ConfigArray == null)
                {
                    var DefaultSettings = new Array(5);
                    DefaultSettings[0] = ["Microsoft", "Contoso, Ltd."];
                    DefaultSettings[1] = ["<your subscription id>", "abcdef01-2345-6789-0abc-def012345678"];
                    DefaultSettings[2] = ["<your name>", "Chris Q. Public"];
                    DefaultSettings[3] = ["<youralias@microsoft.com>", "chrisqpublic@contoso.com"];
                    DefaultSettings[4] = [document.getElementById("ScreenshotScrubberSearchFor").value, document.getElementById("ScreenshotScrubberReplace").value];
                    chrome.storage.sync.set({ConfigArray: ca.ConfigArray});
                }
                else
                {
                    ca.ConfigArray.push([document.getElementById("ScreenshotScrubberSearchFor").value, document.getElementById("ScreenshotScrubberReplace").value]);
                    chrome.storage.sync.set({ConfigArray: ca.ConfigArray}, ()=>{
                        chrome.runtime.sendMessage({ from: "replaceText" }, function(response) {});
                    });
                }
            });
        }
    });
    document.getElementById("ScreenshotScrubberSkipButton").addEventListener("click", ()=>{
        ExtraHighlightNextInstance();
    });
    document.getElementById("ScreenshotScrubberReplaceButton").addEventListener("click", Replace);
    document.getElementById("ScreenshotScrubberReplaceAllButton").addEventListener("click", ()=>{
        var iCountToReplace = foundCount;
        for (var i = 0; i < iCountToReplace; i++)
            Replace();
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

    // document.getElementById("ScreenshotScrubberReplaceButton").addEventListener("click", ()=> {
    //     var replaceAll = (document.getElementById("ScreenshotScrubberReplaceAll") == null ? false : document.getElementById("ScreenshotScrubberReplaceAll").checked);
    //     var replaceText = document.getElementById("ScreenshotScrubberReplace").value;
    //     var updateConfig = document.getElementById("ScreenshotScrubberSaveToConfig").checked;
    //     document.getElementById("ScreenScrubberReplacePromptOverlay").remove();
    //     document.removeEventListener("keydown", ProcessKeyDown, false);
    //     if(updateConfig) {
    //         chrome.storage.sync.get("ConfigArray", function(ca) {
    //             if (ca.ConfigArray == null)
    //             {
    //                 var DefaultSettings = new Array(5);
    //                 DefaultSettings[0] = ["Microsoft", "Contoso, Ltd."];
    //                 DefaultSettings[1] = ["<your subscription id>", "abcdef01-2345-6789-0abc-def012345678"];
    //                 DefaultSettings[2] = ["<your name>", "Chris Q. Public"];
    //                 DefaultSettings[3] = ["<youralias@microsoft.com>", "chrisqpublic@contoso.com"];
    //                 DefaultSettings[4] = [searchText, replaceText];
    //                 chrome.storage.sync.set({ConfigArray: ca.ConfigArray});
    //             }
    //             else
    //             {
    //                 ca.ConfigArray.push([searchText, replaceText]);
    //                 chrome.storage.sync.set({ConfigArray: ca.ConfigArray}, ()=>{
    //                     chrome.runtime.sendMessage({ from: "replaceText" }, function(response) {});
    //                 });
    //             }
    //         });
    //     }
    //     if (replaceAll)
    //         findAndReplace(searchText, replaceText, document.body);
    //     else
    //     {
    //         if (IsTextSelected)
    //         {
    //             for (var i = 0; i < elems.length; i++)
    //             {
    //                 if (elems[i].innerHTML.search(replaceText) != 0);
    //                 {
    //                     elems[i].innerHTML = elems[i].innerHTML.replace(searchText, replaceText);
    //                     i = elems.length;
    //                 }
    //             }
    //         }
    //         else
    //         {
    //             findAndReplace(searchText, replaceText, document.body, true);
    //         }    
    //     }
        
    // });
}