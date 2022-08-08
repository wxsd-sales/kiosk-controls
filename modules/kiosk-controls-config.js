export const config = {
  allowExit: true,          // Permit method to exit kiosk mode
  disableSetting: false,    // Disable the settings menu
  disableAssistant: false,  // Disable Webex Assistant
  disableUltasound: false,  // Disable Ultrasound pairing
  name: 'Kiosk Controls',   // Name of the Button UI and Panel
  kioskUrls: [              // Array of URL which can be selected from the Panel
    {
      "Text" : 'Example Site',            // The user facing text for the URL on the Panel
      "URL" : 'https://www.example.com'   // The URL which is set for Kiosk Mode when selected
    },
    {
      "Text" : 'Whats my user agent',
      "URL" : 'https://www.whatsmyua.info/'
    }
  ]
};
