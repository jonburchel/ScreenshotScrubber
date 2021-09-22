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

var t = Math.round(getQueryVariable("top"), 0);
var l = Math.round(getQueryVariable("left"), 0);
var w = Math.round(getQueryVariable("width"), 0);
var h = Math.round(getQueryVariable("height"), 0);
var r = getQueryVariable("pixelRatio");

document.getElementById("element").innerText = getQueryVariable("element");
var img = document.getElementById("imageCanvas");
img.src = getQueryVariable("screenImg");
img.width = img.width / r;
img.style = "margin: -" + ( t) + "px 0 0 -" + (l) + "px;";
document.getElementById("imageCropDiv").style = "width: " + (w) + "px; height: " + (h) + "px; border:2px solid red;overflow: hidden;";