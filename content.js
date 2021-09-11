function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function findAndReplace(searchText, replacement, searchNode) {
    var regex = new RegExp("((?<=>)[^<]*)(" + escapeRegex(searchText) + ")([^<]*)", 'g');
    searchNode.innerHTML = searchNode.innerHTML.replace(regex, "$1" + replacement + "$3")
}

chrome.storage.sync.get("ConfigArray", function(ca) { 
    if (ca.ConfigArray == null)
        alert("This extension must be configured before its first use.\rRight-click to select Options for initial configuration.");
    else
    {
        function replace(selector, text, newText) 
        {
            var elements = document.querySelectorAll(selector);
            Array.prototype.filter.call(elements, function(element){
            if (text === element.textContent) {
                element.textContent = newText;
            }
            });
        }
        
        function replaceimage(selector, newImageUrl) 
        {
            var elements = document.querySelectorAll(selector);
            Array.prototype.filter.call(elements, function(element){
                element.src = newImageUrl;
            });
        }

        for (var i = 0; i < ca.ConfigArray.length; i++)
        {
            if (ca.ConfigArray[i][0].startsWith('img.') && ca.ConfigArray[i][1].startsWith("http"))
                replaceimage(ca.ConfigArray[i][0], ca.ConfigArray[i][1]);
            else
            {
                findAndReplace(ca.ConfigArray[i][0], ca.ConfigArray[i][1], document.body);
            }
        }
    }
});