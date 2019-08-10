# unreson -- undo/redo-able object wrapper

`unreson` provides the `StateObject` class that manages the state for a provided JSON-safe object. Changes to the object, no matter how deep, may be undone or redone.

**Caveat**: Adding properties should be done by redefining the object, not by adding a new property via its getter -- e.g., `object.state.A = {a: 0, b: 1}`, NOT `object.state.A.a = 0`.

## Usage
```
let unreson = require('unreson')

let myObject = new unreson.StateObject({ a: 0, b: 1, c: {}, d: [0,1,2,3,4] })

console.log(myObject.state) // { a: 0, b: 1, c: {}, d: [ 0, 1, 2, 3, 4 ] }
myObject.state.c = 2
console.log(myObject.state) // { a: 0, b: 1, c: 2, d: [ 0, 1, 2, 3, 4 ] }
myObject.undo()
console.log(myObject.state) // { a: 0, b: 1, c: {}, d: [ 0, 1, 2, 3, 4 ] }
myObject.redo()
console.log(myObject.state) // { a: 0, b: 1, c: 2, d: [ 0, 1, 2, 3, 4 ] }
```
