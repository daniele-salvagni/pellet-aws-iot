let RingBuffer = {

  // ## **`RingBuffer.create(size)`**
  // Create and return a RingBuffer object. Example:
  // ```javascript
  // let size = 3;
  // let rBuffer = RingBuffer.create(size);
  // rBuffer.offer("Command 1");
  // rBuffer.offer("Command 2");
  // print("First command: ", rBuffer.poll());
  // ```
  create: function (size) {
    return p = Object.create({
      offer: RingBuffer.offer,
      poll: RingBuffer.poll,
      peek: RingBuffer.peek,

      _isEmpty: RingBuffer._isEmpty,
      _isFull: RingBuffer._isFull,

      size: size + 1, // "Extra" element to distinguish empty from full
      buffer: [],
      head: 0,
      tail: 0
    });
  },

  // PUBLIC ------------------------------------------------------------------------------

  // ## **`rBuffer.offer(e)`**
  // Insert an element if possible, otherwise return false.
  offer: function (e) {
    if (this._isFull()) return false;
    this.buffer[this.head] = e;
    this.head = ++this.head % this.size;
    return true;
  },

  // ## **`rBuffer.peek()`**
  // Return, but do not remove, the head of the queue.
  peek: function () {
    if (RingBuffer._isEmpty()) return null;
    return this.buffer[this.tail];
  },

  // ## **`rBuffer.poll()`**
  // Remove and return the head of the queue, if empty return null.
  poll: function () {
    if (RingBuffer._isEmpty()) return null;
    let e = this.buffer[this.tail];
    this.buffer[this.tail] = undefined;
    this.tail = ++this.tail % this.size
    return e;
  },

  // PRIVATE -----------------------------------------------------------------------------

  // Check if the buffer is empty
  _isEmpty: function () {
    return (this.head === this.tail) ? true : false;
  },

  // Check if the buffer is full
  _isFull: function () {
    return ((this.head + 1) % this.size === this.tail) ? true : false;
  }

};
