var tbFiller = document.body.insertBefore(document.createElement('div'), document.body.firstChild);
tbFiller.style="position:absolute;z-index:2147483647;left:0;top:0;width:100%;height:100%;background-color:transparent;cursor:crosshair;";
tbFiller.className = "ScreenScrubberPickerOverlay";
document.body.style.cursor = "crosshair";