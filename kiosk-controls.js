/********************************************************
 * 
 * Macro Author:      	William Mills
 *                    	Technical Solutions Specialist 
 *                    	wimills@cisco.com
 *                    	Cisco Systems
 * 
 * Version: 2-0-1
 * Released: 10/20/23
 * 
 * This macro gives you the ability to enable kiosk mode from the touch inteface
 * of your your Webex Devices. If you have a paired Touch 10 or Webex Navigator
 * you can even exit kiosk mode with the macro. It also lets you select between
 * a preconfigured list of Kiosk URLs from the macros UI panel.
 * 
 * In the case where you don't have a paired controller to exit Kiosk Mode
 * you can leverage this example Kiosk Web App which can turn Kiosk Mode off
 * from the Web App itself: https://github.com/wxsd-sales/exit-kiosk-web-app
 * 
 * Full Readme, source code and license details for this macro are available 
 * on Github: https://github.com/wxsd-sales/auto-share-macro
 * 
 ********************************************************/

import xapi from 'xapi';

/*********************************************************
 * Configure the settings below
**********************************************************/

const config = {
  pin: '1234',
  button: {
    name: 'Kiosk Controls'
  },
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
  allowExit: true,
  disableSettings: false,
  disableAssistant: true,
  disableUltrasound: true,
  autoCleanupOnStandby: true,  // Clear web cache when entering standby
  autoCleanupOnHalfwake: true, // Clear web cache when entering halfwake
  autoEnableKioskOnStandby: true,
  autoEnableKioskOnHalfwake: true,
  autoDisableStandby: true,
  panelId: 'kioskcontrols'
}

/*********************************************************
 * Do not change below
**********************************************************/

// This is our main function which initializes everything
async function main() {

  // Create our Button and UI Panel
  await createPanel();
  await createButtons();

  // Update the UI based off system state
  syncUI();

  // Enable WebEngine and WebGL
  xapi.Config.WebEngine.Mode.set('On');
  xapi.Config.WebEngine.Features.WebGL.set('On');

  // Disable/enable recommended features
  xapi.Config.UserInterface.SettingsMenu.Mode.set(config.disableSettings ? 'Locked' : 'Unlocked');
  xapi.Config.UserInterface.Assistant.Mode.set(config.disableAssistant ? 'Off' : 'On');
  xapi.Config.Audio.Ultrasound.MaxVolume.set(config.disableUltrasound ? 0 : 70);

  // Subscribe to Widget and Panel Click events
  xapi.Event.UserInterface.Extensions.Widget.Action.on(processWidgets);
  xapi.Event.UserInterface.Extensions.Panel.Clicked.on(async event => {
    if (!event.PanelId.startsWith(config.panelId)) return;
    const inKioskMode = await getKioskMode();
    if (inKioskMode) {
      console.log(`[${config.button.name}] Clicked - Kiosk Mode Enabled - Prompting For PIN`)
      askForPIN();
    } else {
      console.log(`[${config.button.name}] Clicked - Kiosk Mode Disabled - Opening Kiosk Control Panel`)
      xapi.Command.UserInterface.Extensions.Panel.Open({ PanelId: config.panelId });
    }
  });

  // Subscribe to Text Inputs and Prompt Responses
  xapi.Event.UserInterface.Message.TextInput.Response.on(processTextResponse)
  xapi.Event.UserInterface.Message.Prompt.Response.on(warningResponse);

  // Monitor Kiosk settings change to keep the UI updated
  xapi.Config.UserInterface.Kiosk.Mode.on(syncUI);
  xapi.Config.UserInterface.Kiosk.URL.on(syncUI);

  

  xapi.Status.Standby.State.on(async state => {
    console.log('Standby State Changed to: ', state)
    const inKioskMode = await getKioskMode();
    if (!inKioskMode) return // Take no action if kiosk mode is already enabled.

    if (state === 'EnteringStandby' || state === 'Standby') {
      if (config.autoCleanupOnStandby) performRoomClean();
      if (config.autoEnableKioskOnStandby) setKioskMode('On')
      if (config.autoDisableStandby) setStandbyControl('Off')
    }

    if (state === 'Halfwake') {
      if (config.autoCleanupOnHalfwake) performRoomClean();
      if (config.autoEnableKioskOnHalfwake) setKioskMode('On')
      if (config.autoDisableStandby) setStandbyControl('Off')
    }

  });

  // Subscribe to Room Clean and Standby Events for Debug Logging
  xapi.Event.RoomCleanup.Complete
    .on(value => console.debug('Cleanup Result:', value.Result));
  xapi.Event.Standby.SecondsToStandby
    .on(value => console.debug('Seconds To Standby:', value));
  xapi.Event.Standby.Reset
    .on(value => console.debug('Standby Reset Event:', value));
}

main();

/*********************************************************
 * Below are the function which this macro uses
**********************************************************/


function getKioskMode() {
  return xapi.Config.UserInterface.Kiosk.Mode.get().then(result => result === 'On')
}

function setKioskMode(mode) {
  console.log('Setting Kiosk Mode To:', mode);
  xapi.Config.UserInterface.Kiosk.Mode.set(mode);
}

function setStandbyControl(mode) {
  console.log('Setting Standby Control To:', mode);
  xapi.Config.Standby.Control.set(mode);
  if (mode === 'Off') xapi.Command.Standby.Deactivate();
}

function performRoomClean() {
  console.log('Performing Room Cleanup');
  xapi.Command.RoomCleanup.Run({ ContentType: ['TemporaryAccounts', 'Whiteboards', 'WebData'] });
}

async function getKioskUrl() {
  return await xapi.Config.UserInterface.Kiosk.URL.get();
}

function setKioskURL(url) {
  console.log('Setting Kiosk URL To:', url)
  xapi.Config.UserInterface.Kiosk.URL.set(url);
}


async function toggleKiosk() {
  const state = await xapi.Config.UserInterface.Kiosk.Mode.get()
  if (state == 'On') {
    setKioskMode('Off')
  } else {
    if (config.autoCleanupOnHalfwake || config.autoCleanupOnStandby) performRoomClean();
    if (config.autoDisableStandby) setStandbyControl('Off')
    setKioskMode('On')
  }
}


// Here we handle the user response to the warning message
function warningResponse(response) {
  if (response.FeedbackId != 'kiosk_warning') return;
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

function processTextResponse(event) {
  if (!event.FeedbackId.startsWith(config.panelId)) return;
  const responseType = event.FeedbackId.split('-').pop();
  switch (responseType) {
    case 'pin':
      if (event.Text == config.pin) {
        console.log('Valid PIN Entered - Opening Kiosk Control Panel');
        xapi.Command.UserInterface.Extensions.Panel.Open({ PanelId: config.panelId });
        return;
      } else {
        console.log('Invalid PIN Entered - Displaying Invalid PIN Alert');
        xapi.Command.UserInterface.Message.Alert.Display(
          { Duration: 5, Text: 'The PIN entered was invalid<br> please try again', Title: 'Invalid PIN' });
      }
      break;
  }
}

// This fucntion will set the new Kiosk URL
async function setUrl(selection) {
  const url = config.kioskUrls[selection].url;
  setKioskURL(url);
}

function compareURLs(a, b) {
  a = decodeURIComponent(a).trim();
  b = decodeURIComponent(b).trim();
  return a.includes(b)
}

// This function will get the devices current state and update
// the UI to display the correct state
async function syncUI() {
  console.log('Syncing UI');
  await createPanel();
  const currentURL = await getKioskUrl();
  const selected = config.kioskUrls.findIndex(site => compareURLs(site.url, currentURL));
  if (selected == -1) {
    xapi.Command.UserInterface.Extensions.Widget.UnSetValue({ WidgetId: config.panelId + '-siteGroup' });
  } else {
    xapi.Command.UserInterface.Extensions.Widget.SetValue(
      { Value: selected + 1, WidgetId: config.panelId + '-siteGroup' });
  }
}

function askForPIN() {
  xapi.Command.UserInterface.Message.TextInput.Display({
    FeedbackId: config.panelId + '-pin',
    InputType: 'PIN',
    Placeholder: 'Please Enter PIN',
    SubmitText: 'Submit',
    Text: 'Please Enter PIN',
    Title: config.button.name
  });
}

// This function monitors the UI events
function processWidgets(event) {
  if (!event.WidgetId.startsWith(config.panelId)) return;
  const widget = event.WidgetId.split('-').pop();
  switch (widget) {
    case 'siteGroup':
      if (event.Type != 'pressed') return
      setUrl(event.Value - 1);
      break;
    case 'toggle':
      if (event.Type != 'clicked') return
      toggleKiosk();
      break;
  }
}


// This function creates the hidden main panel
async function createPanel() {
  const button = config.button;
  const sites = config.kioskUrls;
  const panelId = config.panelId;
  let siteGroup = `<Widget>
                  <WidgetId>${panelId}-siteGroup</WidgetId>
                  <Type>GroupButton</Type>
                  <Options>size=4;columns=1</Options>
                  <ValueSpace>`;
  sites.forEach((site, i) => {
    siteGroup = siteGroup.concat(`<Value><Key>${i + 1}</Key><Name>${site.text}</Name></Value>`);
  })
  siteGroup = siteGroup.concat('</ValueSpace></Widget>');
  
  const orderNum = await panelOrder(panelId)
  const inKioskMode = await getKioskMode();

  const order = (orderNum != -1) ? `<Order>${orderNum}</Order>` : '';
  const panel = `<Extensions>
                  <Panel>
                    <Location>Hidden</Location>
                    <Icon>Sliders</Icon>
                    <Color>#CF7900</Color>
                    <Name>${button.name}</Name>
                    ${order}
                    <ActivityType>Custom</ActivityType>
                    <Page>
                      <Name>Site Select</Name>
                      <Row>
                      ${siteGroup}
                      </Row> 
                      <Options>hideRowNames=1</Options>
                    </Page>
                    <Page>
                      <Name>Kiosk Mode</Name>
                      <Row>
                        <Name>Kiosk Mode</Name>
                        <Widget>
                          <WidgetId>${panelId}-toggle</WidgetId>
                          <Name>${inKioskMode ? 'Disable Kiosk Mode' : 'Enable Kiosk Mode'}</Name>
                          <Type>Button</Type>
                          <Options>size=2</Options>
                      </Widget>
                      </Row>  
                      <Options>hideRowNames=1</Options>
                    </Page>
                  </Panel>
                </Extensions>`;
  await xapi.Command.UserInterface.Extensions.Panel.Save({ PanelId: panelId }, panel)
    .catch(error => console.log(`Unable to save panel [${panelId}] - `, e.Message))
}

// This function creates initial buttons which can open the hidden panel
async function createButtons() {
  const button = config.button;
  const panelId = config.panelId;
  const locations = ['HomeScreen', 'ControlPanel'];
  await locations.forEach(async location => {
    const orderNum = await panelOrder(panelId + location)
    const order = (orderNum != -1) ? `<Order>${orderNum}</Order>` : '';
    const panel = `<Extensions>
                  <Panel>
                    <Location>${location}</Location>
                    <Icon>Sliders</Icon>
                    <Color>#0000ff</Color>
                    <Name>${button.name}</Name>
                    ${order}
                    <ActivityType>Custom</ActivityType>
                  </Panel>
                </Extensions>`;
    await xapi.Command.UserInterface.Extensions.Panel.Save({ PanelId: panelId + location }, panel)
      .catch(error => console.log(`Unable to save panel [${panelId}] - `, error.Message))
  })
}

// This function finds the place order of the panel if it was saved previously
async function panelOrder(panelId) {
  const list = await xapi.Command.UserInterface.Extensions.List({ ActivityType: 'Custom' });
  if (!list.hasOwnProperty('Extensions')) return -1
  if (!list.Extensions.hasOwnProperty('Panel')) return -1
  if (list.Extensions.Panel.length == 0) return -1
  for (let i = 0; i < list.Extensions.Panel.length; i++) {
    if (list.Extensions.Panel[i].PanelId == panelId) return list.Extensions.Panel[i].Order;
  }
  return -1
}
