The Screenshot Scrubber allows you to easily replace text and images in web pages, to remove personally identifiable information (PII) to prepare the pages for screenshots in documentation.

To install, just unzip the ScreenshotScrubber.zip file onto your machine, and then use your browser's Extension Manager and select **Load Unpacked**, and browse to the location of the ScreenshotScrubber you just unzipped:

![Shows the extension manager's Load Unpacked button in Chrome](https://user-images.githubusercontent.com/5268147/137599180-af70886b-e1ac-4cf9-bc91-b279229ce0d4.png)

After the extension is loaded, you can configure it with the Options menu accessible on the context options in the Extension manager:

![Shows the ScreenshotScrubber Options menu](https://user-images.githubusercontent.com/5268147/137599251-b9b68257-2b1f-486b-ba99-17dd053fd22b.png)

The Options dialog is displayed with initial values suggested that might commonly need to be replaced.  You can add or remove text replacement values, as well as images to be replaced.

![Shows the Screenshot Scrubber Options dialog](https://user-images.githubusercontent.com/5268147/137599312-a9fa7f48-e329-45f6-9e1a-17ab6d2724fa.png)

You can also replace text and images directly from pages.  

Use Shift+Ctrl+H or invoke by menu to replace text dynamically on any page:

![Shows the Screenshot Scrubber dynamic text replacement dialog](https://user-images.githubusercontent.com/5268147/137599391-bbb34cd3-6ec2-491d-9b75-b7d8ca7ab86e.png)

Use Alt+H or invoke by menu or the Options dialog to choose images for replacement.  An overlay with instructions will cover the page to indicate Screenshot Scrubber is in selection mode.  Use the mouse to pick the image you want to replace:

![Shows the Pick Image overlay for a user to select an image on the page](https://user-images.githubusercontent.com/5268147/137599428-6954fcc4-d977-4ad8-b8e2-b7edfeeec776.png)

Once you pick an image to replace, the Options dialog will appear, so you can configure the HTML match criteria and replacement for the image.  The default image match criteria should typically work to replace images on the page but if not you can experiment with alternate match criteria that might work if the defaults fail.  You can choose to remove the image completely, replace it with a default stock avatar placeholder, or browse to select a replacement image of your own.

![Shows the Screenshot Scrubber Options dialog with an image selected for replacement](https://user-images.githubusercontent.com/5268147/137599506-c7eac263-c65e-47aa-ac3e-d03797c0e80b.png)

When you have configured options, you can scrub a page by using Ctrl+Shift+S, invoking with the menu, or by clicking the Screenshot Scrubber icon in the extension toolbar.  The configured values will be replaced on the page.
