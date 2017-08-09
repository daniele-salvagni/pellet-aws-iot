load('api_uart.js');

load('lib_ringbuffer.js');

let Pellet = {

  // ## **`Pellet.create(uartNo, cfg, parameters)`**
  // Create and return a Pellet object bound to a specific UART, cfg is optional.
  create: function (uartNo, cfg, parameters) {
    let DEFAULT_CFG = { RAM: 0x00, EPR: 0x20, READ: 0x00, WRITE: 0x80 };

    let instance = Object.create({
      // PUBLIC
      update: Pellet.update,
      change: Pellet.change,
      getState: Pellet.getState,

      // PRIVATE
      _findParameter: Pellet._findParameter,
      _handleNext: Pellet._handleNext,

      uartNo: uartNo,
      cfg: cfg || DEFAULT_CFG,
      parameters: parameters,
      state: {},

      commands: RingBuffer.create(16), // FIFO queue for the commands to send
      busy: false, // True if waiting for a response (Half-Duplex)
      timer: null, // The ID of the timeout timer
      error: 0 // 0: no error | 1: timeout | 2: wrong response
    });

    // UART Configuration
    UART.setConfig(uartNo, { baudRate: 1200, numDataBits: 8, numStopBits: 2, parity: 0 });
    UART.setRxEnabled(uartNo, true);
    UART.setDispatcher(uartNo, Pellet._rxHandler, instance);
    return instance;
  },


  // PUBLIC ------------------------------------------------------------------------------

  // ## **`pellet.update(strParam)`**
  // Request to update a parameter value from the device.
  update: function (strParam) {
    let param = this._findParameter(strParam);
    if (!param) return false;

    // Offer a read command: [READ, param]
    commands.offer([this.cfg.READ, param]);
    if (!busy) this._transmit();
  },


  // ## **`pellet.change(strParam, value)`**
  // Request to change a parameter value in the device. Return false if invalid value.
  change: function (strParam, value) {
    let param = this._findParameter(strParam);
    if (!param) return false;

    // The defaults are neutral to the operation
    let offset = param.off || 0;
    let multiplier = param.mult || 1;
    let byteValue = offset + (multiplier * value);
    if (!Pellet._isValidByte(byteValue)) return false;

    // Offer a write command: [WRITE, param, value]
    commands.offer([this.cfg.WRITE, param, byteValue]);
    if (!busy) this._transmit();
    return true;
  },


  // ## **`pellet.getState()`**
  // Return the last updated state of the device (or an empty object).
  getState: function () {

  },


  // PRIVATE -----------------------------------------------------------------------------

  _findParameter: function (param) {
    for (let key in this.parameters) {
      if (key === param) return this.parameters[key];
    }
    return false;
  },


  // Transmit will be called from a callback OR from a timeout (if there is
  // another command queued).
  _transmit: function () {
    this.busy = true;
    let cmd = this.commands.peek();

    // READ Bytes (2): (OPERATION + MEMORY) ADDR_LSB
    txData = chr(cmd[0] + cmd[1].mem) + chr(cmd[1].addr);
    // If it is a write command we need to add a value and a checksum.
    if (cmd[0] === this.cfg.WRITE) {
      // Checksum: (OPERATION + MEMORY) + ADDR_LSB + VALUE) & 0xFF
      let chk = ((cmd[0] + cmd[1].mem) + cmd[1].addr + cmd[2]) & 0xFF;
      // WRITE Bytes (4): (OPERATION + MEMORY) ADDR_LSB VALUE CHECKSUM
      txData += chr(cmd[2]) + chr(chk);
    }

    UART.read(this.uartNo); // Empty the rx buffer
    UART.write(this.uartNo, txData);
    UART.flush(this.uartNo);

    // Timeout if no response has been received
    this.timer = Timer.set(1000, false, function(that) {
      //that.timer = null;
      that.error = 1;
      that.tentatives++;
      that._handleNext();
    }, this);
  },


  // Invoked only via callback
  _rxHandler: function (uartNo, that) {
    let MIN_RESPONSE_BYTES = 2; // All the expected responses should be 2 bytes
    // Check that this callback has been called because there is space available in the
    // rx buffer. (It could be also for space available on the tx buffer)
    let ra = UART.readAvail(uartNo);
    if (ra >= MIN_RESPONSE_BYTES) {
      let cmd = that.commands.peek(); // The command that made the request
      let rxData = UART.read(uartNo);
      print("Received UART data:", rxData);

      if (!cmd) return; // We received data for no reason (or too late), exit.
      // READ Response: CHECKSUM VALUE
      // WRITE Response: ADDR_LSB VALUE
      let rxChecksum = rxData[0];
      let rxValue = rxData[1];

      let chk = (cmd[0] === that.cfg.READ) ?
        ((cmd[0] + cmd[1].mem) + cmd[1].addr + rxValue) & 0xFF :
        cmd[1].addr[0];

      if (rxChecksum.at(0) === chk) {
        that.state[cmd.name] = rxValue; // TODO: convert back the value
      } else {
        that.error = 2;
      }

      Timer.cancel(that.timer); // Cancel the timeout timer
      that.tentatives++;
      that._handleNext();

    }
  },


  _handleNext: function () {
    let MAX_TENTATIVES = 2;
    this.tentatives++;
    // Retry if an error occurred and we have another tentative
    let retry = (this.error && this.tentatives < MAX_TENTATIVES);

    if (retry) {
      // Try again the last command
      this._transmit();
      this.error = 0;
    } else {
      // Handle the next command (if any)
      this.commands.poll();
      this.tentatives = 0;
      this.error = 0;
      this.busy = false;

      if (this.commands.peek()) {
        // There is another command
        this._transmit();
      }
    }
  },


  _isValidByte: function (byte) {
    return (byte % 1 === 0 && byte >= 0x00 && byte <= 0xFF) ? true : false
  }

};

/* TO-DELETE
let P937 = {
  stage:      { mem: 0x00, addr: 0x21, mult: 1, off: 0 }, // Stove current stage
  ambientTmp: { mem: 0x00, addr: 0x01, mult: 1, off: 0 }, // Remote temperature
  probeTmp:   { mem: 0x00, addr: 0x44, mult: 1, off: 0 }, // Probe temperature
  targetTmp:  { mem: 0x20, addr: 0x7D, mult: 1, off: 0 }, // Set temperature
  power:      { mem: 0x20, addr: 0x7F, mult: 1, off: 0 }, // Set power level
  fanLeft:    { mem: 0x20, addr: 0x81, mult: 1, off: 0 }, // Set fan speed (left)
  fanRight:   { mem: 0x20, addr: 0x82, mult: 1, off: 0 } // Set fan speed (right)
};
*/
