# Kiosk Controls
This is a Kiosk Mode control macro which lets you select between differen preconfigure URLs and also enable Kiosk mode for the device. Additional, it allows you to exit Kiosk mode in two ways.

## Open the Kiosk Control panel
![image](https://user-images.githubusercontent.com/21026209/165599603-615b9053-adff-4a81-850d-d63ec538ff06.png)


## Select between preset URLs
![image](https://user-images.githubusercontent.com/21026209/165597255-d26ab4a3-a72a-4a5f-bea6-c2bf28d701bc.png)

## Enable Kiosk Mode
![image](https://user-images.githubusercontent.com/21026209/165599494-3d00b9d5-987e-4173-8052-bbb4d03557ec.png)


## Exit Kiosk mode

### Using the Auto Brightness toggle
The Macro can be configured to exit Kiosk mode by adding the settings menu and setting the Auto Brightness to manual.
To access the settings menu, tap the screen three times with three fingers.

![image](https://user-images.githubusercontent.com/21026209/165740535-4098be95-d044-4740-b7da-a950eb8caa9c.png)

### Using a Cloud xAPI command via an Access Token
If the Webex Device is in shared mode, you can give API access to it via Control Hub. With a Bot or User access token, you can use this macro to disable kiosk mode from within your Web App.

## Requirements

1. RoomOS 10.14.x or above Webex Device.
2. Web admin access to the device to uplaod the macro.
3. Admin access token if you wish to use Cloud xAPI

## Setup

1. Download the ``kiosk-controls.js`` file and upload it to your Webex Room devices Macro editor via the web interface.
2. Configure the Macro by changing the initial values, there are comments explaining each one.
3. Enable the Macro on the editor.

## Support

Please reach out to the WXSD team at [wxsd@external.cisco.com](mailto:wxsd@external.cisco.com?cc=wimills@cisco.com&subject=kiosk-controls)
or contact me on Webex (wimills@cisco.com).
