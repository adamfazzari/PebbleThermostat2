/**
 * Pebble.js for viewing status of Radio Thermostat CT30
 *
 * 
 */

var UI = require('ui');
var Vector2 = require('vector2');
var Vibe = require('ui/vibe');
var ajax = require('ajax');
var URL = 'http://192.168.0.152/tstat';
var DISPLAY_CELSIUS = true;              //Display units
var AWAY_TEMP = 64.5;                    //Temperature to set when 'away'
var HOME_TEMP = 71;                      //Temperature to set when 'home'
var temp = 0;                            //Current temperature in F
var setpoint = 0;                        //Current setpoint in F
var away = false;                        //Away status
var fanmode = 0;                         //Fan status, 0=Auto, 2=On
var display_unit = 'C';                  //Display units
if (!DISPLAY_CELSIUS) {
  display_unit='F';
}

//Convert a given temperature in fahrenheit to the display units, round value in Celsius to nearest 0.5 degrees
function convert_to_display_units(temp_in_F) {
  if (DISPLAY_CELSIUS) {
    return Math.round(((temp_in_F -32) * 5/9)*2)/2;
  } else {
    return temp_in_F;
  }
}

//Text field for the setpoint temperature
var setpoint_field = new UI.Text({
  position: new Vector2(0,20),
  size: new Vector2(144, 75),
  textAlign: 'left',
  font: 'gothic-24-bold',
  text: 'Setpoint: N/A'
});

//Text field for the current temperature
var current_temp_field = new UI.Text({
  position: new Vector2(0,50),
  size: new Vector2(144, 75),
  textAlign: 'left',
  font: 'gothic-24-bold',
  text: 'Current: N/A'
});

//Text field for the status, home or away
var status_field = new UI.Text({
  position: new Vector2(0,80),
  size: new Vector2(144, 75),
  textAlign: 'left',
  font: 'gothic-24-bold',
  text: 'State: N/A'
});

//Fan mode field
var fan_field = new UI.Text({
  position: new Vector2(0,110),
  size: new Vector2(144, 75),
  textAlign: 'left',
  font: 'gothic-24-bold',
  text: 'Fan: N/A'
});

//Splash screen displayed when app is first started
var splashscreen = new UI.Card({
  title: 'Radio Thermostat',
  subtitle: 'connecting...'
});

//Error screen displayed when there's a problem communicating with the thermostat
var errorscreen = new UI.Card({
  title: 'Radio Thermostat',
  subtitle: 'could not connect'
});

//Main screen with up and down buttons for adjusting setpoint
var mainwindow = new UI.Window({
  fullscreen: true,
  backgroundColor: 'black',
  action: {
    up: 'images/up.png',
    down: 'images/down.png',
    select: 'images/fan.png',
    backgroundColor: 'white'
  }
});

mainwindow.add(setpoint_field);
mainwindow.add(current_temp_field);
mainwindow.add(status_field);
mainwindow.add(fan_field);

//Up and down keys change the setpoint
mainwindow.on('click','up',function(){
  setpoint += 1;
  change_setpoint_field(setpoint);
});
      
mainwindow.on('click','down',function(){
  setpoint -= 1;
  change_setpoint_field(setpoint);
});

//Long click select switch between home and away modes
mainwindow.on('longClick','select',function(){
  away = !away;
  console.log("Away: " + away);
  if (away){
    status_field.text('Away');
    change_setpoint_field(AWAY_TEMP);
  } else {
    //If the setpoint is currently set to the away temp, then set it to the home temp
    if (setpoint <= AWAY_TEMP) {
      setpoint = HOME_TEMP;
    }
    status_field.text('Home');
    change_setpoint_field(setpoint);
  }
});

//Click select controls fan mode
mainwindow.on('click','select',function(){
  if (fanmode===0) {
    fanmode = 2;
  } else {
    fanmode = 0;
  }
  set_fan_field(fanmode);
});

//On back button click, send the update to the thermostat
//If status is away, setpoint is set to AWAY_TEMP and hold is turned on.
mainwindow.on('click','back',function(){
  console.log('Submit');
  var sp = setpoint;
  var hold = 0;
  
  if (away) {
    sp = AWAY_TEMP;
    hold = 1;
  } else {
    sp = setpoint;
    hold = 0;
  }
  
  var json_data = {t_heat:sp,hold:hold,fmode:fanmode};
  
  ajax({
    url:URL, 
    method:'post',
    data:json_data,
    type:'json',
    crossDomain: true
  }, 
       function(json){
         //success
         console.log("Success");
         console.log(JSON.stringify(json));
         Vibe.vibrate('short');
         splashscreen.hide();
         mainwindow.hide();
       },
       function(error){
         //error
         console.log("ERROR:" + error);
         Vibe.vibrate('double');
         splashscreen.hide();
         mainwindow.hide();
       });
});

//Change the setpoint field text label based on a temerature given in fahrenheit
function change_setpoint_field(temp_in_F) {
  setpoint_field.text('Setpoint: ' + convert_to_display_units(temp_in_F) + display_unit);
}

//Change the fan mode field to On or Auto
function set_fan_field(fan_mode){
  if (fanmode===0) {
    fan_field.text('Fan: Auto');
  } else {
    fan_field.text('Fan: On');
  }
}

//Configuration
Pebble.addEventListener('showConfiguration', function() {
  var url = 'https://rawgithub.com/adamfazzari/PebbleThermostat2/master/html/config.html';

  Pebble.openURL(url);
});

//Main app starts here
splashscreen.show();

ajax({url: URL, type: 'json'},
    function(json){
      console.log('Success');
      
      //Parse json response for setpoint, current temp, fan, and hold
      temp = json.temp;
      setpoint = json.t_heat;
      fanmode = json.fmode;
      if (setpoint <= AWAY_TEMP && json.hold == 1) {
        away = true;
        status_field.text('Away');
      } else {
        away = false;
        status_field.text('Home');
      } 
      current_temp_field.text('Current: ' + convert_to_display_units(temp) + 'C');
      change_setpoint_field(setpoint);
      set_fan_field(fanmode);
      
      splashscreen.hide();
      mainwindow.show();
    },
    function(error){
      console.log('Failure');
      splashscreen.hide();
      errorscreen.show();
});