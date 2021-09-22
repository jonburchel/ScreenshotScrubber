document.addEventListener('mouseup', function(mousePos){
  if (mousePos.button == 0 && document.body.style.cursor == "crosshair") 
  {
    var p = {clientX: mousePos.clientX, clientY: mousePos.clientY};
    var elems = document.elementsFromPoint(mousePos.clientX, mousePos.clientY);
    var elem = null;
    for (var i = 0; i < elems.length; i++)
    {
      if (elems[i].tagName.toLowerCase() == "img" || 
          elems[i].tagName.toLowerCase() == "svg")
      {
            var originalI = i;
            while(i <= elems.length && elems[i].id == "")
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
                      pixelRatio: window.devicePixelRatio,
                      from: 'mouseup'};
            chrome.runtime.sendMessage(msg, function(response) {
              document.body.firstChild.remove(); // remove the overlay <div> we created for crosshairs during item selection
            });
            document.body.style.cursor = "default";
            i = elems.length;
          }
      }
  }
});
