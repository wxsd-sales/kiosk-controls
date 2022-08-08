import xapi from 'xapi';
import {config} from './kiosk-controls-config';

/*********************************************************
 * Below the function which this macro uses
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
    console.log('Exit xAPI command received: Existing Kiosk Mode');
    toggleKiosk(false);
  } else if (event.Text == 'EnableKiosk'){
    console.log('Enable xAPI command received: Enable Kiosk Mode');
    toggleKiosk(true);
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
      Title: config.name,
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
  const url = config.kioskUrls[urlNumber].URL;

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
  config.kioskUrls.forEach((site, i) => {

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

  // Create our rows of sites based off the provided array
  let sites = '';
  config.kioskUrls.forEach( (site, i) => {
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
      <Name>${config.name}</Name>
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


export {
    monitorMessage,
    widgetEvent,
    createPanel,
    speakerTrack,
    syncUI,
    warningResponse
}
