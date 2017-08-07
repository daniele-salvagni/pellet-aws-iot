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
  create: function(size) {
    return p = Object.create({
      offer:RingBuffer.offer,
      poll:RingBuffer.poll,
      peek:RingBuffer.peek,
      isEmpty:RingBuffer.isEmpty,
      isFull:RingBuffer.isFull,
      size: size + 1, /* Extra element to distinguish empty from full */
      rBuf: [],
      head: 0,
      tail: 0
    });
  },

  // ## **`rBuffer.offer(e)`**
  // Insert an element if possible, otherwise return false.
  offer: function(e) {
    if (this.isFull()) return false;
    this.rBuf[this.head] = e;
    this.head = ++this.head % this.size;
    return true;
  },

  // ## **`rBuffer.peek()`**
  // Return, but do not remove, the head of the queue.
  peek: function() {
    if (this.isEmpty()) return null;
    return this.rBuf[this.tail];
  },

  // ## **`rBuffer.poll()`**
  // Remove and return the head of the queue, if empty return null.
  poll: function() {
    if (this.isEmpty()) return null;
    let e = this.rBuf[this.tail];
    this.rBuf[this.tail] = null;
    this.tail = ++this.tail % this.size
    return e;
  },

  // ## **`rBuffer.isEmpty()`**
  // Check if the buffer is empty
  isEmpty: function() {
    if (this.head === this.tail)
      return true;
    else
      return false;
  },

  // ## **`rBuffer.isFull()`**
  // Check if the buffer is full
  isFull: function() {
    if ((this.head + 1) % this.size === this.tail)
      return true;
    else
      return false;
  }
}
