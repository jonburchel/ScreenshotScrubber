if (document.getElementById("ScreenScrubberPickerMsg") == null)
{
    var tbFillerMsg = document.body.insertBefore(document.createElement('div'), document.body.firstChild);
    tbFillerMsg.style="position:fixed;z-index:2147483647;left:0;top:0;width:100%;height:100%;color:blue;background-color:transparent;cursor:crosshair;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;";
    tbFillerMsg.innerHTML = "<center style='font-size:36pt; font-weight:700; font-style: bold; color:blue; text-shadow: 3px 3px 16px lightgoldenrodyellow;'>\
                                <br><br><br>Press ESC to exit or pick an image on the page to replace.\
                            </center>";
    tbFillerMsg.id = "ScreenScrubberPickerMsg";

    var tbFiller = document.body.insertBefore(document.createElement('div'), document.body.firstChild);
    tbFiller.style="position:fixed;z-index:2147483647;left:-50%;top:0;width:400%;height:400%;\
                    background-image:\
                        linear-gradient(45deg, cornflowerblue 25%, transparent 25%), \
                        linear-gradient(-45deg, cornflowerblue 25%, transparent 25%), \
                        linear-gradient(45deg, transparent 75%, cornflowerblue 75%), \
                        linear-gradient(-45deg, transparent 75%, cornflowerblue 75%); \
                        background-size: 10px 10px; \
                        background-repeat: repeat; \
                        cursor:crosshair;opacity:15%;\
                        transform: rotate(45deg);\
                        translateX(500px)";
    tbFiller.id = "ScreenScrubberPickerOverlay";
    tbFiller.className = "ScreenScrubberPickerOverlay";
    document.body.style.cursor = "crosshair";
    function ProcessKeyDown(kv)
    {
        if (kv.keyCode == 27)
        {
            tbFiller.remove();
            tbFillerMsg.remove();
            document.body.style.cursor = "default";
            document.removeEventListener("keydown", ProcessKeyDown);
        }
    }

    document.addEventListener("keydown", ProcessKeyDown);
}