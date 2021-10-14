function PickImage(mousePos)
{
  var p = {clientX: mousePos.clientX, clientY: mousePos.clientY};
  var elems = document.elementsFromPoint(mousePos.clientX, mousePos.clientY);
  var elem = null;
  for (var i = 0; i < elems.length; i++)
  {
    if (elems[i].tagName.toLowerCase() == "img" || 
        elems[i].tagName.toLowerCase() == "svg" ||
        elems[i].tagName.toLowerCase() == "span" ||
        (elems.find(e=>e.tagName.toLowerCase() == "img") == undefined && 
         elems.find(e=>e.tagName.toLowerCase() == "svg") == undefined && 
         elems.find(e=>e.tagName.toLowerCase() == "span") == undefined && 
         elems[i].tagName.toLowerCase() == "div" && elems[i].childElementCount == 0 &&
         elems[i].className != "ScreenScrubberPickerOverlay" && elems[i].id != "ScreenScrubberPickerMsg"))
    {
          var originalI = i;
          if (elems[i].tagName.toLowerCase() == "svg")
          {
            while(i <= elems.length && elems[i].tagName.toLowerCase() != "div")
              i++;
          }
          while(i <= elems.length && elems[i].id == "" && elems[i].className == "" && (elems[i].src == "" || elems[i].src == undefined))
            i++;
          if (i >= elems.length) { i = originalI; }
          elem = elems[i];
          var offsets = elem.getBoundingClientRect();
          var elemhtml = encodeURIComponent(elem.outerHTML);
          var msg = {text: 'SelectedElement', 
                    element: elemhtml, 
                    top: offsets.top, 
                    left: offsets.left,
                    width: offsets.width,
                    height: offsets.height,
                    imgWidth: window.innerWidth,
                    pixelRatio: window.devicePixelRatio,
                    from: 'mouseup'};
          var PickerOverlay = document.getElementById("ScreenScrubberPickerOverlay");
          var PickerMsg = document.getElementById("ScreenScrubberPickerMsg");
          try 
          {
                if (PickerOverlay != null)
                {
                    PickerOverlay.remove(); // remove the overlay <div> we created for crosshairs during item selection
                    PickerMsg.remove();
                    document.removeEventListener("keydown", function() {});
                }          
                document.body.style.cursor = "default";
                setTimeout(() => { chrome.runtime.sendMessage(msg, function(response) {}); }, 0);
                
          }
          catch (e)
          {
            alert(e);
            if (PickerOverlay != null) 
            {
              PickerOverlay.remove(); // remove the overlay <div> we created for crosshairs during item selection
              PickerMsg.remove();
              document.removeEventListener("keydown", function(){});
            }
            document.body.style.cursor = "default";
            alert("The extension has been reloaded since this page was refreshed.  Please refresh the page and try again.");
          }
          i = elems.length;
        }
    }
}

var GlobalPos = null;
document.addEventListener('mouseup', function(mousePos){
  GlobalPos = mousePos;
  if (mousePos.button == 0 && document.body.style.cursor == "crosshair") 
    PickImage(mousePos);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse)=>{
  if (message.action == "ReplaceImage" && GlobalPos != null)
    PickImage(GlobalPos)
  return Promise.resolve("Message handled.");
});
