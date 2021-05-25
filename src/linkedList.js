class LinkedListNode {
  constructor(price, size, next = null) {
    this.price = price;
    this.size = size;
    this.next = next;
  }
}

  class OrderBook {

    constructor(orderBook) {
      this.sequence = orderBook.data.data.sequence;
      this.asksLinkedList = {
        let: 0,
        head: null,
        tail:  null,
      }
      this.bidsLinkedList = {
        let: 0,
        head: null,
        tail: null,
      }
      this.init(orderBook)
    }

  init(orderBook) {
    const asksArray = orderBook.data.data.asks
    const bidsArray = orderBook.data.data.bids

    asksArray.forEach(el => {
      this.prepend(el[0], el[1], 'asksLinkedList');
    });

    bidsArray.forEach(el => {
      this.prepend(el[0], el[1], 'bidsLinkedList');
    });
  }

  prepend(price, size, list) {
    const newNode = new LinkedListNode(price, size, this[list].head);
    this[list].head = newNode;
    this[list].let++;
   
    if (!this[list].tail) {
      this[list].tail = newNode;
    }
  }

  deleteNode(price, list) {
    

    if (!this[list].head) {
      return null;
    }

    let deletedNode = null;
    
    if (this[list].head && this[list].head.price === price) {
      deletedNode = this[list].head; 
      this[list].head = this[list].head.next;
      this[list].let--;
      return deletedNode;
    }

    let currentNode = this[list].head;
    

    if (currentNode !== null){
      while (currentNode.next) {
        if (currentNode.next.price === price) {
          deletedNode = currentNode.next;
          currentNode.next = currentNode.next.next;
          this[list].let--;
          break;
        }
        currentNode = currentNode.next;
      }
    }

    if (this[list].tail && this[list].tail === price) {
      this[list].tail = currentNode;
    }
    
    return deletedNode;
     
  }

  updatePrice (price, size, list) {
   
    
    if (!this[list].head) {
      return null;
    }

    let currentNode = this[list].head;

    while (currentNode) {
      if (currentNode.price === price) {
        currentNode.size = size
        return currentNode;
      }
      currentNode = currentNode.next;
    }

    const newNode = this.addNewNode(price, size, list);
    return newNode
  }

  addNewNode (price, size, list) {
    
    this[list].let++;
    if (this[list].head && this[list].head.price < price) {
      // console.log(`Add head ${list}`)
      const newNode = new LinkedListNode(price, size, this[list].head)
      this[list].head = newNode
      return newNode;
    }

    if (this[list].tail && this[list].tail.price < price) {
      // console.log(`Add tail ${list}`)
      const newNode = new LinkedListNode(price, size, null)
      this[list].tail.next = newNode
      this[list].tail = newNode;
      return newNode;
    }

    let currentNode = this[list].head;

    while(currentNode.next) {
      if (currentNode.next.price < price) {
        const newNode = new LinkedListNode(price, size, currentNode.next)
        // console.log(`Add body ${list}`)
        currentNode.next = newNode;
        return newNode;
      }
      currentNode = currentNode.next;
    }
    


  }
}

module.exports = OrderBook;