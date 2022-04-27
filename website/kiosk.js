
let device;
let token;

async function init() {
  
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);        

  const frame = document.getElementById('mainFrame');
  
  const url = urlParams.get('iframe');
  device = urlParams.get('device');
  token = urlParams.get('token');
  
  if (url != null) {
    frame.setAttribute("src", urlParams.get('url'));
    frame.style.visibility = 'visible';
  }
  
  if (token != null && device != null) {
    connected();
  } else {
    notConnected();  
  }
  connected();

}

window.onload = async function() {
	init();
};


function exitKiosk() {
  
  var myHeaders = new Headers();
  myHeaders.append("Authorization", "Bearer "+token);
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({
    "deviceId": device,
    "arguments": {
      "Text": "DisableKiosk"
    }
  });

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  fetch("https://webexapis.com/v1/xapi/command/Message.Send", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));

}


function notConnected() {
  console.log('Unable to connect to device');
  document.getElementById("error").style.visibility = 'hidden';
}

function connected() {
  console.log('Connected to device');
  document.getElementById("controls").style.visibility = 'visible';
  
}


function openModal() {
  console.log('Open Modal');
  document.getElementById("modal").style.visibility = 'visible';
}

function closeModal() {
  console.log('Close Modal');
  document.getElementById("modal").style.visibility = 'hidden';
}

window.onclick = function(event) {
  if (event.target == document.getElementById("modal")) {
    document.getElementById("modal").style.visibility = 'hidden';
  }
}
