load('api_config.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_uart.js');

load('api_pellet.js');
// NOTE: log to DynamoDB every 10 minutes
// Update Shadow every? <5


let cfg = { RAM: 0x00, EPR: 0x20, READ: 0x00, WRITE: 0x80 };

let P937 = {
  stage:      { mem: 0x00, addr: 0x21, mult: 1, off: 0 }, // Stove current stage
  ambientTmp: { mem: 0x00, addr: 0x01, mult: 2, off: 0 }, // Remote temperature
  probeTmp:   { mem: 0x00, addr: 0x44, mult: 1, off: 0 }, // Probe temperature
  targetTmp:  { mem: 0x20, addr: 0x7D, mult: 1, off: 0 }, // Set temperature
  power:      { mem: 0x20, addr: 0x7F, mult: 1, off: 0 }, // Set power level
  fanLeft:    { mem: 0x20, addr: 0x81, mult: 1, off: 0 }, // Set fan speed (left)
  fanRight:   { mem: 0x20, addr: 0x82, mult: 1, off: 0 }  // Set fan speed (right)
};


let pellet = Pellet.create(2, cfg, P937);
pellet.update('stage');


let getInfo = function() {
  return JSON.stringify({total_ram: Sys.total_ram(), free_ram: Sys.free_ram()});
};


let led = 12;
// Blink built-in LED every second
GPIO.set_mode(led, GPIO.MODE_OUTPUT);
Timer.set(5000 /* 1 sec */, true /* repeat */, function() {
  let value = GPIO.toggle(led);
  print(value ? 'Tick' : 'Tock', 'uptime:', Sys.uptime(), getInfo());
  //UART.write(uartNo, "test");
  if (null !== undefined) print('YAY');

  let stage = pellet.getState().stage;
  if (stage !== undefined) print("Stage is:",stage);

  pellet.update('stage');

}, null);


// Monitor network connectivity.
Net.setStatusEventHandler(function(ev, arg) {
  let evs = "???";
  if (ev === Net.STATUS_DISCONNECTED) {
    evs = "DISCONNECTED";
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = "CONNECTING";
  } else if (ev === Net.STATUS_CONNECTED) {
    evs = "CONNECTED";
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = "GOT_IP";
  }
  print("== Net event:", ev, evs);
}, null);
