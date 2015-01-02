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
var AWAY_TEMP = 64.5;
var temp = 0;
var setpoint = 0;

var setpoint_field = new UI.Text({
  position: new Vector2(0,20),
  size: new Vector2(144, 75),
  textAlign: 'left',
  font: 'gothic-24-bold',
  text: 'Setpoint: N/A'
});

var current_temp_field = new UI.Text({
  position: new Vector2(0,50),
  size: new Vector2(144, 75),
  textAlign: 'left',
  font: 'gothic-24-bold',
  text: 'Current: N/A'
});

var status_field = new UI.Text({
  position: new Vector2(0,80),
  size: new Vector2(144, 75),
  textAlign: 'left',
  font: 'gothic-24-bold',
  text: 'State: N/A'
});

var splashscreen = new UI.Card({
  title: 'Radio Thermostat',
  subtitle: 'connecting...'
});

var errorscreen = new UI.Card({
  title: 'Radio Thermostat',
  subtitle: 'could not connect'
});

var mainwindow = new UI.Window({
  fullscreen: true,
  backgroundColor: 'white',
  action: {
    up: 'images/up.png',
    down: 'images/down.png',
    backgroundColor: 'white'
  }
});

mainwindow.add(setpoint_field);
mainwindow.add(current_temp_field);
mainwindow.add(status_field);

mainwindow.on('click','up',function(){
  setpoint += 1;
  setpoint_field.text('Setpoint: ' + setpoint + 'C');
});
      
mainwindow.on('click','down',function(){
  setpoint -= 1;
  setpoint_field.text('Setpoint: ' + setpoint + 'C');
});

mainwindow.on('click','back',function(){
  console.log('submit');
  setpoint = Math.round(setpoint * (9/5) + 32);

  ajax({
    url:URL, 
    method:'post',
    data:{t_heat:setpoint},
    type:'json',
    crossDomain: true
  }, 
       function(json){
         //success
         console.log("Success");
         console.log(JSON.stringify(json));
         Vibe.vibrate('short');
       },
       function(error){
         //error
         console.log(error);
         Vibe.vibrate('double');
       });
  splashscreen.hide();
  mainwindow.hide();
});

mainwindow.on('longClick','back',function(){
  splashscreen.hide();
  mainwindow.hide();
});

splashscreen.show();

ajax({url: URL, type: 'json'},
    function(json){
      console.log('Success');
      
      temp = Math.round((json.temp - 32) * (5/9));
      setpoint = Math.round((json.t_heat - 32) * (5/9));
      if (json.temp <= AWAY_TEMP && json.hold) {
        status_field.text('Away');
      } else {
        status_field.text('Home');
      } 
      current_temp_field.text('Current: ' + temp + 'C');
      setpoint_field.text('Setpoint: ' + setpoint + 'C');
      
      splashscreen.hide();
      mainwindow.show();
    },
    function(error){
      console.log('Failure');
      splashscreen.hide();
      errorscreen.show();
    });