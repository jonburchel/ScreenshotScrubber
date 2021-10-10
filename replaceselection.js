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

var replaceText = prompt("Replacement text:");
var replaceAll = confirm("Click OK to replace ALL occurrences or Cancel to replace just this one.");

if (!replaceAll)
    for (var i = 0; i < elems.length; i++)
    {
        if (elems[i].innerHTML.search(document.getSelection().toString()) != 0);
        {
            elems[i].innerHTML = elems[i].innerHTML.replace(document.getSelection().toString(), replaceText);
            i = elems.length;
        }
    }
else
    findAndReplace(document.getSelection().toString(), replaceText, document.body);


