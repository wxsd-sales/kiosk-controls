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
import {config} from './kiosk-controls-config';
import {createPanel, widgetEvent, monitorMessage, syncUI, warningResponse, speakerTrack} from './kiosk-controls-utils';

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
  xapi.Config.UserInterface.SettingsMenu.Mode.set(config.disableSettings ? 'Locked' : 'Unlocked');
  xapi.Config.UserInterface.Assistant.Mode.set(config.disableAssistant ? 'Off' : 'On');
  xapi.Config.Audio.Ultrasound.MaxVolume.set(config.disableUltrasound ? 0 : 70);

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
  if(config.allowExit) {
    xapi.Status.Cameras.SpeakerTrack.Status.on(speakerTrack);
  }
}

main();
