/********************************************************
Copyright (c) 2022 Cisco and/or its affiliates.
This software is licensed to you under the terms of the Cisco Sample
Code License, Version 1.1 (the "License"). You may obtain a copy of the
License at
               https://developer.cisco.com/docs/licenses
All use of the material herein must be in accordance with the terms of
the License. All rights not expressly granted by the License are
reserved. Unless required by applicable law or agreed to separately in
writing, software distributed under the License is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied.
*********************************************************
 * 
 * Macro Author:      	William Mills
 *                    	Technical Solutions Specialist 
 *                    	wimills@cisco.com
 *                    	Cisco Systems
 * 
 * Version: 1-0-0
 * Released: 04/28/22
 * 
 * This macro gives you the ability to enable kiosk mode from the touch inteface
 * of your your Webex Devices. If you have a paired Touch 10 or Webex Navigator
 * you can even exit kiosk mode with the macro. It also lets your select between
 * preset Kiosk URLs fromt he macros UI panel.
 * 
 * Lastly, the macro also allows you to toggle kiosk mode by sending the special
 * keywords ExistKiosk or EnterKiosk to the device via the Message Send xAPI 
 * command. This can be done from your Web App or its backend.
 * 
 ********************************************************/

import xapi from 'xapi';


/*********************************************************
 * Configure the settings below
**********************************************************/


// Set this to be true if you would like to allow exiting kiosk mode
// by pressing the Do Not Disturb button in the hidden menu
const ALLOW_EXIT = true;

// These are recommend settings to disable while in kiosk mode
// they harden the device and limit settings access
const DISABLE_SETTINGS = false;
const DISABLE_ASSISTANT = false;
const DISABLE_ULTRASOUND = false;

// Specify the button/panel name
const BUTTON_NAME = 'Kiosk Control';

// Specify the URLs
// The Text parameter will be shown on the macros UI Panel
// The URL will be set as the Kiosk URL when selected on the panel toggles
// Ensure the URLs contain the full address eg (http://www.google.com)
// Also ensure the same URL isn't used twice
const KIOSK_URLS = [
  {
    "Text" : 'Example Site',
    "URL" : 'https://www.example.com'
  },
  {
    "Text" : 'Example Site 2',
    "URL" : 'https://www.example2.com'
  }
];



/*********************************************************
 * Do not change below
**********************************************************/


// This is our main function which initializes everything
async function main(){

  // Create our Button and UI Panel
  createPanel();

  // Update the UI based off system state
  await syncUI();

  // Enable WebEngine and WebGL
  xapi.Config.WebEngine.Mode.set('On');
  xapi.Config.WebEngine.Features.WebGL.set('On');


  // Disable/enable recommend features
  xapi.Config.UserInterface.SettingsMenu.Mode.set(DISABLE_SETTINGS ? 'Locked' : 'Unlocked');
  xapi.Config.UserInterface.Assistant.Mode.set(DISABLE_ASSISTANT ? 'Off' : 'On');
  xapi.Config.Audio.Ultrasound.MaxVolume.set(DISABLE_ULTRASOUND ? 0 : 70);

  // Listen for all toggle events
  xapi.Event.UserInterface.Extensions.Widget.Action.on(widgetEvent);

  // Listen for Message Send events, used to exist Kiosk Mode via Cloud xAPI
  xapi.Event.Message.Send.on(monitorMessage);

  // Monitor Kiosk settings change to keep the UI updated
  xapi.Config.UserInterface.Kiosk.Mode.on(syncUI);
  xapi.Config.UserInterface.Kiosk.URL.on(syncUI);

  // Monitor the response to the warning prompt when no URL is set
  xapi.Event.UserInterface.Message.Prompt.Response.on(warningResponse);

  // Monitor for changes to the SpeakerTrack state so we can exit Kiosk Mode
  if(ALLOW_EXIT) {
    xapi.Status.Cameras.SpeakerTrack.Status.on(speakerTrack);
  }

}

// Run our main function
main();


/*********************************************************
 * Below are the function which this macro uses
**********************************************************/

// This function is called when speakerTrack is enable/disable
// using this while in kiosk mode, we can provide a way to 
// easily have our macro disable kiosk mode and return to normal
async function speakerTrack(event) {

  const state = getKioskMode();

  if(state == 'On' && event == 'Inactive') {
    console.log('Disabling Kiosk Mode')
    setKioskMode('Off');
  }

}

async function getKioskMode() {
  return await xapi.Config.UserInterface.Kiosk.Mode.get();
}

async function setKioskMode(mode) {
  xapi.Config.UserInterface.Kiosk.Mode.set(mode);
}

async function getKioskUrl() {
  return await xapi.Config.UserInterface.Kiosk.URL.get();
}

async function setKioskURL(url) {
  xapi.Config.UserInterface.Kiosk.URL.set(url);
}

// This function is called when a xAPI Send Message is called
// it will exit kiosk mode when it heards the keyword ExistKiosk
function monitorMessage(event) {

  if(event.Text == 'ExitKiosk'){
    console.log('Closing Kiosk');
    toggleKiosk(false);
  }

}

// This function will toggle kiosk mode
// It will also check a Kiosk URL is set before enabling and
// warn the user of this case
async function toggleKiosk(state){

  if(!state) {
    console.log('Disabling Kiosk Mode');
    setKioskMode('Off');
  } else {
    const currentURL = await getKioskUrl();

    if(currentURL == ''){
      console.log('No Kiosk URL set, warning user');
      warnUser();
    } else {
      console.log('Enabling Kiosk Mode');
      setKioskMode('On');
    }

  }

  syncUI();

}

// This function is ued to diaplay a warning prompt when no Kiosk URL is set
function warnUser() {

  xapi.Command.UserInterface.Message.Prompt.Display(
    {
      Title: BUTTON_NAME,
      Text: 'Warning: No Kiosk URL configured. The device will show as Out of Service. Are you sure you want to enable Kiosk Mode?',
      FeedbackId: 'kiosk_warning',
      "Option.1": "Yes",
      "Option.2": "No"
    });
}

// Here we handle the user response to the warning message
function warningResponse(response) {

  if(response.FeedbackId != 'kiosk_warning') {
    return;
  }
  
  switch (response.OptionId) {
    case '1':
      console.log('Warning accepted, enabling Kiosk Mode');
      setKioskMode('On');
      break;
    case '2':
      console.log('Warning rejected, not enabling kiosk Mode');
      syncUI();
      break;
  }

}


// This fucntion will set the new Kiosk URL
async function setUrl(widget) {

  // Identify which Kiosk Toggle widget was selected
  const urlNumber = widget.charAt(widget.length - 1);

  // Find the appropriate URL from our URL array
  const url = KIOSK_URLS[urlNumber].URL;

  console.log('Kiosk URL set to: ' + url);

  setKioskURL(url);

  syncUI();
  
}


// This function will get the devices current state and update
// the UI to display the correct state
async function syncUI() {

  console.log('Syncing UI')

  // Check if there is already a URL set
  const currentURL = await getKioskUrl();

  // Update the site selection panel
  KIOSK_URLS.forEach((site, i) => {

    const match = currentURL == site.URL;

    xapi.Command.UserInterface.Extensions.Widget.SetValue({
        WidgetId: 'kiosk_site_'+i,
        Value: match ? 'on' : 'off',
      });

  });

  // Update the Kiosk toggle panel
  const kioskState = await getKioskMode();

  xapi.Command.UserInterface.Extensions.Widget.SetValue({
    WidgetId: 'kiosk_toggle',
    Value: kioskState,
  });

}


// This function monitors the UI events
function widgetEvent(event){

  if (event.WidgetId == 'kiosk_toggle') {
    toggleKiosk(event.Value === 'on');
  } else if (event.WidgetId.startsWith('kiosk_site_')){
    setUrl(event.WidgetId);
  }

}


// Here we create the Button and Panel for the Macro UI
async function createPanel() {

  let sites = '';

  // Create our rows of sites based off the provided array
  KIOSK_URLS.forEach( (site, i) => {

    const row = `
      <Row>
        <Name>${site.Text}</Name>
        <Options>size=1</Options>
        <Widget>
          <WidgetId>kiosk_site_${i}</WidgetId>
          <Type>ToggleButton</Type>
          <Options>size=1</Options>
        </Widget>
      </Row>`;

    sites = sites.concat(row);

  })

  const panel = `
  <Extensions>
    <Version>1.8</Version>
    <Panel>
      <Order>1</Order>
      <Type>Statusbar</Type>
      <Icon>Sliders</Icon>
      <Color>#CF7900</Color>
      <Name>${BUTTON_NAME}</Name>
      <ActivityType>Custom</ActivityType>
      <Page>
        <Name>Site Select</Name>
        ${sites}
      </Page>
      <Page>
        <Name>Kiosk Mode</Name>
        <Row>
          <Name>Kiosk Mode</Name>
          <Widget>
            <WidgetId>kiosk_toggle</WidgetId>
            <Type>ToggleButton</Type>
            <Options>size=1</Options>
          </Widget>
        </Row>  
        <Options/>
      </Page>
    </Panel>
  </Extensions>`;


  xapi.Command.UserInterface.Extensions.Panel.Save(
    { PanelId: 'kiosk_panel' }, 
    panel
  )
  
}
