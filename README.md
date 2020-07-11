# unreson -- undo/redo-able object wrapper

`unreson` provides the `StateObject` class that manages the state for a provided JSON-safe object. Changes to the object, no matter how deep, may be undone or redone. The state of the object can also be made temporarily immutable if the need arises.

## Usage

    let unreson = require('unreson')

    let myObject = new unreson.StateObject({ a: 0, b: 1, c: {}, d: [0,1,2,3,4] })

    console.log(myObject.state) // { a: 0, b: 1, c: {}, d: [ 0, 1, 2, 3, 4 ] }
    myObject.state.c = 2
    console.log(myObject.state) // { a: 0, b: 1, c: 2, d: [ 0, 1, 2, 3, 4 ] }
    myObject.undo()
    console.log(myObject.state) // { a: 0, b: 1, c: {}, d: [ 0, 1, 2, 3, 4 ] }
    myObject.redo()
    console.log(myObject.state) // { a: 0, b: 1, c: 2, d: [ 0, 1, 2, 3, 4 ] }
    myObject.freeze()
    console.log(myObject.frozen) // true
    myObject.state.c = 3
    myObject.thaw()
    console.log(myObject.frozen) // false
    console.log(myObject.state) // { a: 0, b: 1, c: 2, d: [ 0, 1, 2, 3, 4 ] }
