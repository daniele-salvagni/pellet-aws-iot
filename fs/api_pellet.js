load('api_uart.js');

load('lib_ringbuffer.js');

let Pellet = {

  // ## **`Pellet.create(uartNo, cfg)`**
  // Create and return a Pellet object bound to a specific UART, cfg is optional.
  create: function (uartNo, cfg) {
    // Create an instance object from the prototype
    let instance = Object.create({
      // PUBLIC
      getState: Pellet.getState,
      update: Pellet.update,

      // PRIVATE
      _handleNext: Pellet._handleNext,

      cfg: cfg || { RAM: 0x00, EPR: 0x20, READ: 0x00, WRITE: 0x80 },
      uartNo: uartNo,

      commands: RingBuffer.create(16), // Command queue
      state: {}, // The last updated state obtained from the device
      busy: false, // Waiting for a response
      error: 0 // 0: no error | 1: timeout | 2: wrong response
    });

    // UART Configuration
    UART.setConfig(uartNo, { baudRate: 1200, numDataBits: 8, numStopBits: 2, parity: 0 });
    UART.setRxEnabled(uartNo, true);
    // Set UART dispatcher callback which gets invoked when there is a new data in the
    // input buffer or when the space becomes available on the output buffer.
    UART.setDispatcher(uartNo, Pellet._handler, instance);

    return instance;
  },

  // PUBLIC ------------------------------------------------------------------------------

  // ## **`pellet.update(uartNo)`**
  // Request to update a parameter value from the device.
  update: function (param) {
    // READ Command: [READ, param]
    commands.offer([this.cfg.READ, param]);
    if (!busy) this._transmit();
  },

  // ## **`pellet.change(uartNo)`**
  // Request to change a parameter value in the device.
  change: function (param, value ) {
    // WRITE Command: [WRITE, param, value]
    commands.offer([this.cfg.WRITE, param]);
    if (!busy) this._transmit();
  },

  // ## **`pellet.getState()`**
  // Return the last updated state of the device (or an empty object).
  getState: function () {

  },

  // PRIVATE -----------------------------------------------------------------------------

  // Transmit will be called from a callback OR from a timeout (if there is
  // another command queued).
  _transmit: function () {
    this.busy = true;
    let cmd = commands.peek();
    let req = '';

    if (cmd[0] === this.cfg.READ) {
      // We need to send a read command
      // READ Data: (0x00 + TYPE) ADDR_LSB
      req = chr(this.cfg.READ + cmd[1].mem) + chr(cmd[1].addr);
    } else if (cmd[0] === this.cfg.WRITE) {
      // We need to send a write command (needs a checksum)
      // Chacksum: (0x80 + TYPE) + ADDR_LSB + VALUE) & 0xFF
      let chk = ((this.cfg.WRITE + cmd[1].mem) + cmd[1].addr + cmd[2]) & 0xFF;
      // WRITE Data: (0x80 + TYPE) ADDR_LSB VALUE CHECKSUM
      req = chr(WRITE + cmd[1].mem) + chr(cmd[1].addr) + chr(cmd[2]) + chr(chk);
    }

    UART.read(this.uartNo); // Flush RX
    UART.write(this.uartNo, req);
    UART.flush(this.uartNo);

    // Timeout if no response has been received
    Timer.set(1000, false, function(that) {
      that.timeout = true;
      that.tentatives++;
      // Retry or go to the next command in queue
      that._handleNext();
    }, this);
  },

  // Invoked via callback
  _handler: function (uartNo, that) {
    let MIN_RESPONSE_BYTES = 2;
    // Check that this callback has been called because there is space available in the
    // rx buffer. (It could be also for space available on the tx buffer)
    let ra = UART.readAvail(uartNo);
    if (ra >= MIN_RESPONSE_BYTES) {
      let cmd = commands.peek(); // The command that was sent
      // Read the received data
      // READ Response: CHECKSUM VALUE
      // WRITE Response: ADDR_LSB VALUE
      let res = UART.read(uartNo);
      print("Received UART data:", res);

      // TODO: CONTINUE HERE
      // - Implement OFFSET and MULTIPLIER
      // - Handle responses
      // - Create and provide a state

      if (!cmd) return; // We received data for no reason

      if (cmd[0] === that.cfg.READ) { // Response to a READ command

      } else { // Response to a WRITE command

      }

          /* Checksum: (TYPE + ADDR_MSB + ADDR_LSB + VALUE) & 0xFF */
        let chk = (param.mem + param.addr + uData.res[1].at(0)) & 0xFF;
        if (chk === uData.res[0].at(0)) {
          print("Checksum is correct");
          return res[1];
        } else {
          print("Checksum is wrong");
          return null;
        }
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
      // handle the next command (if any)
      this.commands.poll();
      this.tentatives = 0;
      this.error = 0;
      this.busy = false;

      if (this.commands.peek()) {
        // There is another command
        this._transmit();
      }
    }
  }

};

/* TO-DELETE
let P937 = {
  stage:      { mem: 0x00, addr: 0x21, mult: 1, off: 0, name: 'stage' },      // Stove current stage
  ambientTmp: { mem: 0x00, addr: 0x01, mult: 1, off: 0, name: 'ambientTmp' }, // Remote temperature
  probeTmp:   { mem: 0x00, addr: 0x44, mult: 1, off: 0, name: 'probeTmp' },   // Probe temperature
  targetTmp:  { mem: 0x20, addr: 0x7D, mult: 1, off: 0, name: 'targetTmp' },  // Set temperature
  power:      { mem: 0x20, addr: 0x7F, mult: 1, off: 0, name: 'power' },      // Set power level
  fanLeft:    { mem: 0x20, addr: 0x81, mult: 1, off: 0, name: 'fanLeft' },    // Set fan speed (left)
  fanRight:   { mem: 0x20, addr: 0x82, mult: 1, off: 0, name: 'fanRight' }    // Set fan speed (right)
};
*/
