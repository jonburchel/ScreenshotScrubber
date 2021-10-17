# Screenshot Scrubber

The Screenshot Scrubber browser extension allows you to easily replace text and images in web pages to remove personally identifiable information (PII) to prepare the pages for screenshots in documentation.  It can also have fun other uses to trick family members into thinking you or they are in the news, or  to prove that your checking account has ten billion dollars.

## Installation

To install, just unzip the [ScreenshotScrubber.zip](https://github.com/jonburchel/ScreenshotScrubber/releases/download/v1.0/ScreenshotScrubber.zip) file onto your machine, and then use your browser's Extension Manager and select **Load Unpacked**.  Browse to the location of the ScreenshotScrubber folder you just unzipped, and **Select Folder**:

![Shows the extension manager's Load Unpacked button in Chrome](https://user-images.githubusercontent.com/5268147/137613533-1d66214f-6e21-48ad-a098-8155cff6032e.png)

## Configuration

After the extension is loaded, you can configure it with the Options menu accessible on the context options in the Extension manager:

![Shows the ScreenshotScrubber Options menu](https://user-images.githubusercontent.com/5268147/137599251-b9b68257-2b1f-486b-ba99-17dd053fd22b.png)

The Options dialog is displayed with initial values suggested that might commonly need to be replaced.  You can add or remove text replacement values, as well as images to be replaced.

![Shows the Screenshot Scrubber Options dialog](https://user-images.githubusercontent.com/5268147/137599312-a9fa7f48-e329-45f6-9e1a-17ab6d2724fa.png)

## Dynamic on-page text replacement

You can also replace text and images directly from pages.  

Use Shift+Ctrl+H or invoke by menu to replace text dynamically on any page:

![Shows the Screenshot Scrubber dynamic text replacement dialog](https://user-images.githubusercontent.com/5268147/137613355-7a8745df-d159-4586-adc5-2b7a4c788da2.png)

## Image replacement

Use Alt+H or invoke by menu or the Options dialog to choose images for replacement.  An overlay with instructions will cover the page to indicate Screenshot Scrubber is in selection mode.  Use the mouse to pick the image you want to replace:

![Shows the Pick Image overlay for a user to select an image on the page](https://user-images.githubusercontent.com/5268147/137599428-6954fcc4-d977-4ad8-b8e2-b7edfeeec776.png)

Once you pick an image to replace, the Options dialog will appear, so you can configure the HTML match criteria and replacement for the image.  The default image match criteria should typically work to replace images on the page but if not you can experiment with alternate match criteria that might work if the defaults fail.  You can choose to remove the image completely, replace it with a default stock avatar placeholder, or browse to select a replacement image of your own.

![Shows the Screenshot Scrubber Options dialog with an image selected for replacement](https://user-images.githubusercontent.com/5268147/137599506-c7eac263-c65e-47aa-ac3e-d03797c0e80b.png)

## Scrubbing a page

When you have configured options, you can scrub a page by using Ctrl+Shift+S, invoking with the menu, or by clicking the Screenshot Scrubber icon in the extension toolbar.  The configured values will be replaced on the page.

## Example

Here is the Screenshot Scrubber README page on GitHub.  I identified some text and an avatar I want to replace.

![Shows a web page with some PII highlighted that I want to replace.](https://user-images.githubusercontent.com/5268147/137604141-1bbcc09e-8338-45ad-a0c9-9acf29015341.png)

I configure the Screenshot Scrubber Options accordingly:

![Shows the Screenshot Scrubber configured to replace the PII I want to replace.](https://user-images.githubusercontent.com/5268147/137604158-e21d6577-1433-4f61-9102-2d5ce90b9526.png)

I scrub the page then, and voila!

![Shows the same web page from above, scrubbed with its values replaced.](https://user-images.githubusercontent.com/5268147/137604180-75bc7f52-0a49-4797-9f84-f9b4eefbad58.png)

