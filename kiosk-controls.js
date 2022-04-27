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



async function doNotDisturb(event) {

  const state = await xapi.Config.UserInterface.Kiosk.Mode.get();

  if(state == 'On' && event == 'Active') {
    console.log('Disabling Kiosk Mode')
    xapi.Config.UserInterface.Kiosk.Mode.set('Off');
  }

}

function toggleKiosk(value){

  console.log('Kiosk Mode currently disabled, now enabling');
  xapi.Config.UserInterface.Kiosk.Mode.set( value ? 'On' : 'Off');
  xapi.Config.WebEngine.Mode.set('On');
  syncUI();

}

async function createURL(site){


  const deviceId = await xapi.Status.Webex.DeveloperId.get()
  
  let link = '';

  const bot = site.Bot ? `bot=${BOT_TOKEN}&` : '';
  const iframe = site.iFrame != null ? `iframe=${site.iFrame}&` : '';
  const device = site.Device ? `device=${deviceId}` : '';

  link = `${site.URL}?${bot}${device}${iframe}`;

  console.log('Generated URL: ' + link);

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

function compareURL(current, site) {
  if(contains(current, createURL(site))) {
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
  KIOSK_URLS.forEach( (site, i) => {

    xapi.Command.UserInterface.Extensions.Widget.SetValue({
        WidgetId: 'kiosk_site_'+i,
        Value: (compareURL(currentURL, site)) ? 'on' : 'off',
      });

  });

  const kioskState = await xapi.Config.UserInterface.Kiosk.URL.get();

  xapi.Command.UserInterface.Extensions.Widget.SetValue({
    WidgetId: 'kiosk_toggle',
    Value: kioskState,
  });

}

function widgetEvent(event){

  console.log(event);

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
        <Options/>
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

  // Monitor URL changes
  //xapi.Config.UserInterface.HomeScreen.Peripherals.WebApp.URL.on(syncUI);

  if(ALLOW_EXIT) {
    xapi.Status.Conference.DoNotDisturb.on(doNotDisturb);
  }

}

main();
