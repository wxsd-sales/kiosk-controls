# Kiosk Controls
This is a Kiosk control macro which enables a user to select between different preconfigured URLs and toggle Kiosk mode on a Webex Device needing admin access. This is useful in situations where an admin would like to delegate the selection of Kiosk Web Apps to local staff.

## Open the Kiosk Control panel
![image](https://user-images.githubusercontent.com/21026209/165599603-615b9053-adff-4a81-850d-d63ec538ff06.png)


## Select between preset URLs
![image](https://user-images.githubusercontent.com/21026209/165597255-d26ab4a3-a72a-4a5f-bea6-c2bf28d701bc.png)

## Enable Kiosk Mode
![image](https://user-images.githubusercontent.com/21026209/165599494-3d00b9d5-987e-4173-8052-bbb4d03557ec.png)


## Exit Kiosk mode

### Using the Macro UI Panel
If you have a Touch 10 or Webex Room Navigator paired with your Webex Device in controller mode. The Macros UI panel will be alway be accessible even when Kiosk Mode is available. This easily allows your to exit Kiosk Mode by toggling the feature off using the panels UI.

### Using the SpeakerTrack Toggle
The Macro can exit Kiosk mode by monitoring for setting change events. In this case the Macro monitors the Camera SpeakerTrack feature. You can access the settings menu by tapping the screen three times with three fingers. Then by navigating to the camera settings and disabling SpeakerTrack, the Macro will exit Kiosk Mode for you.

### Using a Cloud xAPI command via an Access Token
You can also use Cloud xAPI commands to exit Kiosk mode from your Kiosk web app. The Macro listens for the keyword 'ExistKiosk' which can be sent to the device using Message Send xAPI. More information on this Cloud xAPI command can be found here: https://roomos.cisco.com/xapi/Command.Message.Send/

## Requirements

1. RoomOS 10.14.x ( with RoomOS 11 Enabled ) or above Webex Device.
2. Web admin access to the device to uplaod the macro.
3. Admin access token if you wish to use Cloud xAPI

## Setup

1. Download the ``kiosk-controls.js`` file and upload it to your Webex Room devices Macro editor via the web interface.
2. Configure the Macro by changing the initial values, there are comments explaining each one.
3. Enable the Macro on the editor.

## Support

Please reach out to the WXSD team at [wxsd@external.cisco.com](mailto:wxsd@external.cisco.com?subject=kiosk-controls)

