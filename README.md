# Kiosk Controls
This is a Kiosk control macro which enables a user to select between different preconfigured URLs and enable/disable Kiosk mode on a Webex Device. This is useful in situations where an admin would like to delegate the selection of Kiosk Web Apps to local staff and also allow them to exit Kiosk mode and use the device for normal calling functions.

### Open the Kiosk Control panel
![image](https://user-images.githubusercontent.com/21026209/165599603-615b9053-adff-4a81-850d-d63ec538ff06.png)

### Select between preset URLs
![image](https://user-images.githubusercontent.com/21026209/165597255-d26ab4a3-a72a-4a5f-bea6-c2bf28d701bc.png)

### Enable Kiosk Mode
![image](https://user-images.githubusercontent.com/21026209/165599494-3d00b9d5-987e-4173-8052-bbb4d03557ec.png)

## Overview

This macro has the following features:

### Selection of Kiosk URL:

* The macro can be configured with a list of possible Kiosk URLs in which to allow users to select from. This way an admin can create a list of internal or external content in which the users near device can change between.
    ```javascript
      kioskUrls: [
    {
      text: 'Exit Kiosk Example',
      url: 'https://wxsd-sales.github.io/exit-kiosk-web-app/exitKioskWebapp.html?username=kioskwebapp&password=examplePassword'
    },
    {
      text: 'Webex Bank Example',
      url: 'https://cisco-ce.github.io/roomos-samples/kiosk-example/'
    }
  ],
    ```

### Exiting Kiosk Mode options:

* Using the Macro UI Panel - If you have a Touch 10 or Webex Room Navigator paired with your Webex Device in controller mode. The Macros UI panel will be always be accessible even when Kiosk Mode is available. This easily allows you to exit Kiosk Mode by toggling the feature off using the panels UI.

* Using the Kiosk Web App - It is possible for the Kiosk Web App to connect to the Desk or Board device in which it is running on and disable Kiosk mode. This example Web App demonstrates how to do this:
      https://github.com/wxsd-sales/exit-kiosk-web-app

### Auto Toggle Standby Mode:

* When Kiosk Mode is enabled, it normal practice to disable Standby Mode so the Kiosk Web App is shown all day how ever when Kiosk Mode is disable the macro can turn Standby Mode On again.

### Auto Room Cleanup:

* When the Device enters either Halfwake or Standby ( either trigger is configurable in the macro ), then the macro can be configured to perform a Room Cleanup on any cached Web, Whiteboards and TemporaryAccount data 

### Auto Enable Kiosk Mode:

* When the Device enters either Halfwake or Standby ( either trigger is configurable in the macro ), then the can be configured to re-enable Kiosk Mode


## Setup

### Prerequisites & Dependencies: 

- Webex Desk or Board Series Device running RoomOS 11.8 or above
    - *Kiosk mode is not supported on Webex Room Series, Desk Hub, DX70, or DX80*
- Web admin access to the device to uplaod the macro
- Admin access token if you wish to use Cloud xAPI


### Installation Steps:
1. Download the ``kiosk-controls.js`` file and upload it to your Webex Room devices Macro editor via the web interface.
2. Configure the Macro by changing the initial values, there are comments explaining each one.
3. Enable the Macro on the editor.
  

## Demo

*For more demos & PoCs like this, check out our [Webex Labs site](https://collabtoolbox.cisco.com/webex-labs).


## License

All contents are licensed under the MIT license. Please see [license](LICENSE) for details.


## Disclaimer

Everything included is for demo and Proof of Concept purposes only. Use of the site is solely at your own risk. This site may contain links to third party content, which we do not warrant, endorse, or assume liability for. These demos are for Cisco Webex use cases, but are not Official Cisco Webex Branded demos.


## Questions
Please contact the WXSD team at [wxsd@external.cisco.com](mailto:wxsd@external.cisco.com?subject=kiosk-controls) for questions. Or, if you're a Cisco internal employee, reach out to us on the Webex App via our bot (globalexpert@webex.bot). In the "Engagement Type" field, choose the "API/SDK Proof of Concept Integration Development" option to make sure you reach our team. 
