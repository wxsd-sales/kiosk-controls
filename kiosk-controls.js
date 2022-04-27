import xapi from 'xapi';

// This Webex Device Kiosk Macro is meant to be run in conjuntion
// with a web app which recevies a Device ID and Bot Token as URL parameters.
// The web app can then uses this information to make Cloud xAPI commands.
// eg. https://www.example.com/?device=12345&token12345

// Create a Bot for your Webex Org on developer.webex.com and give the BOT
// read/write on Control Hub to the device in which this Macro will be running.
const BOT_TOKEN = '##################';

// Set this to true if you would like to allow exiting kiosk mode
// by pressing the Do Not Disturb button in the hidden menu
const ALLOW_EXIT = true;

// These are recommend settings to disable while in kiosk mode
const DISABLE_SETTINGS = false;

const DISABLE_ASSISTANT = false;

const DISABLE_ULTRASOUND = false;

const BUTTON_NAME = 'Kiosk Control';

const KIOSK_URLS = [
  {
    "Text" : 'iFrame Example and Bot',
    "URL" : 'https://www.example.com',
    "iFrame" : 'https://www.exampleiframe.com',
    "Bot": true 
  },
  {
    "Text" : 'Simple Page',
    "URL" : 'https://www.google.com',
  } 
];

////// Do not touch /////

async function brightnessChange(event) {

  const state = await xapi.Config.UserInterface.Kiosk.Mode.get();

  if(state == 'On' && event == 'Manual') {
    console.log('Disabling Kiosk Mode')
    xapi.Config.UserInterface.Kiosk.Mode.set('Off');
  }

}

function monitorMessage(event) {

  if(event.Text == 'ExitKiosk'){
    console.log('Closing Kiosk');
    toggleKiosk(false);
  }

}

async function toggleKiosk(state){

  if(!state) {
    xapi.Config.UserInterface.Kiosk.Mode.set('Off');
  } else {
    const currentURL = await xapi.Config.UserInterface.Kiosk.URL.get();

    if(currentURL == ''){
      console.log('No Kiosk URL set, warning user');
      warnUser();
    } else {
      console.log('No Kiosk URL set, warning user');
      xapi.Config.UserInterface.Kiosk.Mode.set('On');
    }

  }

  syncUI();

}

function forceEnable() {
  xapi.Config.UserInterface.Kiosk.Mode.set('On');
}

async function createURL(site){


  const deviceId = await xapi.Status.Webex.DeveloperId.get()
  
  let link = '';

  const bot = site.Bot ? `bot=${BOT_TOKEN}&` : '';
  const iframe = site.iFrame != null ? `iframe=${site.iFrame}&` : '';
  const device = site.Device ? `device=${deviceId}` : '';

  const paremters = `${bot}${device}${iframe}`;

  if (paremters === ''){
    link = site.URL;
  } else {
    link = `${site.URL}?${bot}${device}${iframe}`;
  }

  //console.log('Generated URL: ' + link);

  return link;

}

async function setKioskURL(widget) {

  const urlNumber = widget.charAt(widget.length - 1);

  console.log(KIOSK_URLS[urlNumber])

  const url = await createURL(KIOSK_URLS[urlNumber]);

  console.log('Kiosk URL set to: ' + url);

  xapi.Config.UserInterface.Kiosk.URL.set(url);

  syncUI();
  
}

function contains(a, b) {
  return (a.indexOf(b) != -1)
}

async function compareURL(current, site) {

  const url = await createURL(site)
 
  if(contains(current, url)) {
    return true;
  }
  return false;
}

// Updates the UI with the current states
async function syncUI() {

  console.log('Syncing UI')

  // Check if there is already a URL set
  const currentURL = await xapi.Config.UserInterface.Kiosk.URL.get();

  // Update the Site select panel
  KIOSK_URLS.forEach( async (site, i) => {

    const match = await compareURL(currentURL, site);

    xapi.Command.UserInterface.Extensions.Widget.SetValue({
        WidgetId: 'kiosk_site_'+i,
        Value: match ? 'on' : 'off',
      });

  });

  const kioskState = await xapi.Config.UserInterface.Kiosk.Mode.get();

  xapi.Command.UserInterface.Extensions.Widget.SetValue({
    WidgetId: 'kiosk_toggle',
    Value: kioskState,
  });

}

function widgetEvent(event){

  if (event.WidgetId == 'kiosk_toggle') {
    toggleKiosk(event.Value === 'on');
  } else if (event.WidgetId.startsWith('kiosk_site_')){
    setKioskURL(event.WidgetId)
  }

}


// Here we create the Button and Panel for the UI
async function createPanel() {

  let sites = '';

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
          <Name>Toggle Kiosk Mode</Name>
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
    { PanelId: 'pwa_enable' }, 
    panel
  )
  
}


// Our main function which initializes everything
async function main(){

  createPanel();

  await syncUI();


  // Enable web egine
  xapi.Config.WebEngine.Mode.set('On');
  xapi.Config.WebEngine.Features.WebGL.set('On');


  // Disable/enable recommend features
  xapi.Config.UserInterface.SettingsMenu.Mode.set(DISABLE_SETTINGS ? 'Locked' : 'Unlocked');
  xapi.Config.UserInterface.Assistant.Mode.set(DISABLE_ASSISTANT ? 'Off' : 'On');
  xapi.Config.Audio.Ultrasound.MaxVolume.set(DISABLE_ULTRASOUND ? 0 : 70);

  // Listen for all toggle events
  xapi.Event.UserInterface.Extensions.Widget.Action.on(widgetEvent);

  // Listen to messages from cloud xapi
  xapi.Event.Message.Send.on(monitorMessage);

  // Monitor Kiosk changes to update the UI
  xapi.Config.UserInterface.Kiosk.Mode.on(syncUI)

  if(ALLOW_EXIT) {
    xapi.Config.Video.Output.Connector.BrightnessMode.on(brightnessChange);
  }

}

main();
