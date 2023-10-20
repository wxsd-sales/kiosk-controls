/********************************************************
 * 
 * Macro Author:      	William Mills
 *                    	Technical Solutions Specialist 
 *                    	wimills@cisco.com
 *                    	Cisco Systems
 * 
 * Version: 2-0-0
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

xapi.Status.Diagnostics.Message.get()
.then(result=>console.log(JSON.stringify(result)))


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
  autoCleanup: true,
  autoEnableKiosk: true,
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


  // Disable/enable recommend features
  xapi.Config.UserInterface.SettingsMenu.Mode.set(config.disableSettings ? 'Locked' : 'Unlocked');
  xapi.Config.UserInterface.Assistant.Mode.set(config.disableAssistant ? 'Off' : 'On');
  xapi.Config.Audio.Ultrasound.MaxVolume.set(config.disableUltrasound ? 0 : 70);

  // Listen for all toggle events
  xapi.Event.UserInterface.Extensions.Widget.Action.on(processWidgets);
  xapi.Event.UserInterface.Extensions.Panel.Clicked.on(event => {
    if (!event.PanelId.startsWith(config.panelId)) return;
    kioskEnabled()
      .then(enabled => {
        if (enabled) {
          askForPIN();
        } else {
          xapi.Command.UserInterface.Extensions.Panel.Open({ PanelId: config.panelId });
        }
      })
  });

  xapi.Event.UserInterface.Message.TextInput.Response.on(processTextResponse)

  // Monitor Kiosk settings change to keep the UI updated
  xapi.Config.UserInterface.Kiosk.Mode.on(syncUI);
  xapi.Config.UserInterface.Kiosk.URL.on(syncUI);

  // Monitor the response to the warning prompt when no URL is set
  xapi.Event.UserInterface.Message.Prompt.Response.on(warningResponse);

  xapi.Event.UserInterface.Extensions.Event.PageOpened
    .on(value => console.log('Page Opened', value));

  xapi.Event.UserInterface.Extensions.Event.PageClosed
    .on(value => console.log('Page Closed', value));

  if (config.autoCleanup) {

    xapi.Status.Standby.State.on(state => {
      console.log('Standby State Changed to: ', state)

      if (state != 'Standby') return;

      console.log('Performing Room Clean Up')
      xapi.Command.RoomCleanup.Run({ ContentType: ['TemporaryAccounts', 'Whiteboards', 'WebData'] });

      if (config.autoEnableKiosk) {

        xapi.Config.UserInterface.Kiosk.Mode.set('On');
      }
    });
  }

  xapi.Event.RoomCleanup.Complete.on(value => {
    console.log('Cleanup result', value)
  });

  xapi.Event.Standby.SecondsToStandby
    .on(value => console.log('Seconds to Standby:',value));

    xapi.Event.Standby.Reset
    .on(value => console.log('Standby Reset Event',value));

}

// Run our main function
main();


/*********************************************************
 * Below are the function which this macro uses
**********************************************************/


function kioskEnabled() {
  return xapi.Config.UserInterface.Kiosk.Mode.get().then(result => result === 'On')
}

async function setKioskMode(mode) {
  console.log('Setting Kiosk Mode: ', mode);
  xapi.Config.UserInterface.Kiosk.Mode.set(mode);
}

async function getKioskUrl() {
  return await xapi.Config.UserInterface.Kiosk.URL.get();
}

async function setKioskURL(url) {
  xapi.Config.UserInterface.Kiosk.URL.set(url);
}


// This function will toggle kiosk mode
// It will also check a Kiosk URL is set before enabling and
// warn the user of this case
async function toggleKiosk() {
  const state = await xapi.Config.UserInterface.Kiosk.Mode.get()
  if (state == 'On') {
    setKioskMode('Off')
  } else {
    setKioskMode('On')
  }
}

// This function is ued to diaplay a warning prompt when no Kiosk URL is set
function warnUser() {
  xapi.Command.UserInterface.Message.Prompt.Display(
    {
      Title: config.button.name,
      Text: 'Warning: No Kiosk URL configured. The device will show as Out of Service. Are you sure you want to enable Kiosk Mode?',
      FeedbackId: 'kiosk_warning',
      "Option.1": "Yes",
      "Option.2": "No"
    });
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
        console.log('PIN valid - opening panel');
        xapi.Command.UserInterface.Extensions.Panel.Open({ PanelId: config.panelId });
        return;
      } else {
        console.log('Invalid PIN - notify user');
        xapi.Command.UserInterface.Message.Alert.Display(
          { Duration: 5, Text: 'The PIN entered was invalid, please try again', Title: 'Invalid PIN' });
      }
      break;
  }
}

// This fucntion will set the new Kiosk URL
async function setUrl(selection) {
  const url = config.kioskUrls[selection].url;
  console.log('Setting Kiosk URL set to: ' + url);
  setKioskURL(url);
  //syncUI();
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
  console.log('Asking for PIN input')
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
  console.log(event)
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


// Here we create main hidden panel
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
  const kioskModeEanabled = await kioskEnabled();

  console.log('Kiosk Mode Enabled: ', kioskModeEanabled);

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
                          <Name>${kioskModeEanabled ? 'Disable Kiosk Mode' : 'Enable Kiosk Mode'}</Name>
                          <Type>Button</Type>
                          <Options>size=2</Options>
                      </Widget>
                      </Row>  
                      <Options>hideRowNames=1</Options>
                    </Page>
                  </Panel>
                </Extensions>`;
  await xapi.Command.UserInterface.Extensions.Panel.Save({ PanelId: panelId }, panel)
  .catch(error=>console.log(`Unable to save panel [${panelId}] - `, e.Message))
}

// Here we create main initial buttons which can open the hidden panel
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
    .catch(error=>console.log(`Unable to save panel [${panelId}] - `, e.Message))
  })
}

// This function finds the place order of the panel if it was saved previously
async function panelOrder(panelId) {
  const list = await xapi.Command.UserInterface.Extensions.List({ ActivityType: 'Custom' });
  if (!list.Extensions.hasOwnProperty('Panel')) return -1
  if (list.Extensions.Panel.length == 0) return -1;
  for (let i = 0; i < list.Extensions.Panel.length; i++) {
    if (list.Extensions.Panel[i].PanelId == panelId) return list.Extensions.Panel[i].Order;
  }
  return -1;
}
