<h1 align="center"><br>
<img src="https://user-images.githubusercontent.com/6751621/29040987-705cb454-7bb1-11e7-9bc9-250dc4410273.png" alt="Pellet">
<br><br>
</h1>

<div align="center"><sub><pre>Do not use this without proper knowledge, you may risk damaging your device.</pre></sub>

![Travis](https://img.shields.io/travis/daniele-salvagni/pellet-aws-iot.svg) ![ESP32](https://img.shields.io/badge/platform-esp32-1a7bbd.svg) ![Pellet](https://img.shields.io/badge/pellet-burning-5861a3.svg)

</div>

> ESP32 firmware to connect a pellet stove to AWS IoT. Implemented specifically for a Piazzetta P937 model.



### Contents

- [About](#about)
- [Configuration](#configuration)
- [Build](#build)


### Firmware configuration

To create a new `Pellet` object you will need to provide the number of the **UART** port to
use on your ESP32 and an optional **configuration**. If not provided, the `cfg` showed here is
the default which is common on most Micronova boards.

```javascript
let uartNo = 2; // UART port to use on the ESP32

let cfg =  {
  RAM: 0x00,    // Type used to access RAM values
  EPR: 0x20,    // Type used to access EEPROM values
  READ: 0x00,   // Command used READ from the device
  WRITE: 0x80   // Command used WRITE to the device
};

let pellet = Pellet.create(uartNo, cfg);

```

You will then need an object for each parameter you want to read or change, memory
locations might vary on different devices or versions so be careful. The object must
contain:

- `mem`: the memory where the value is stored, this must be equal to the `RAM` or `EPR`
values in the configuration;
- `addr`: the memory address of the value;
- `name`: this name will be used to create an entry in the `state` object returned by
  `getState()`.

For most values the device will use a formula to store them in a single byte which is
`realValue = off + (mult * memoryValue)`. Without further configuration you would have
to work with the memory values but there are two additional (optional) attributes that
will be used to automatically convert the values sent to and read from the device:

- `off` (optional): the offset of the value, default is `0`;
- `mult` (optional): the multiplier of the value, default is `1`.

As an example, the temperatures stored in memory are usually half the real value, so in
this case you should use `off: 0` and `mult: 2`. You will then be able to write and read
temperatures directly in Celsius degrees.


```javascript
// Example for a Piazzetta P937 model

let P937 = {
  stage:      { mem: cfg.RAM, addr: 0x21, mult: 1, off: 0, name: 'stage' },
  ambientTmp: { mem: cfg.RAM, addr: 0x01, mult: 1, off: 0, name: 'ambientTmp' },
  probeTmp:   { mem: cfg.RAM, addr: 0x44, mult: 1, off: 0, name: 'probeTmp' },
  targetTmp:  { mem: cfg.EPR, addr: 0x7D, mult: 1, off: 0, name: 'targetTmp' },
  power:      { mem: cfg.EPR, addr: 0x7F, mult: 1, off: 0, name: 'power' },
  fanLeft:    { mem: cfg.EPR, addr: 0x81, mult: 1, off: 0, name: 'fanLeft' },
  fanRight:   { mem: cfg.EPR, addr: 0x82, mult: 1, off: 0, name: 'fanRight' }
};
```

Here be dragons.
