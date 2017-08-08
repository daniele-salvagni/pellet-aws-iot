load('api_config.js');
load('api_gpio.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');

load('api_pellet.js')

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
