import { diff, applyChanges, revertChanges } from 'yajsondiff'

export function cloneObject(object) {
  if (!object) return object

  let cloned = (object instanceof Array) ? [] : {};
  for (let k in object) {
    let v = object[k]
    cloned[k] = (v instanceof Object) ? cloneObject(v) : v
  }
  return cloned
}

export function setProxy(instance, proxyObject) {
  let handler = {
    get: function (obj, prop) {
      return obj[prop]
    },
    set: function (obj, prop, value) {
      let lastState = cloneObject(instance._state)
      if (value instanceof Object) {
        obj[prop] = setProxy(instance, value)
      } else {
        obj[prop] = value
      }
      let change = diff(lastState, instance._state)
      if (change != null) {
        instance.add(change)
      }
      return true
    }
  }
  return new Proxy(proxyObject ? proxyObject : {}, handler)
}

export class StateObject {
  constructor(orig) {
    this.state = orig
    this.changes = []
    this.changePosition = 0
  }

  set state(v) {
    this._state = setProxy(this, cloneObject(v))
  }

  get state() {
    return this._state
  }

  stringify() {
    return JSON.stringify(this._state)
  }

  add(change) {
    this.changes.splice(this.changePosition++, this.changes.length, change)
  }
  undo() {
    if (this.changePosition <= 0 || this.changePosition > this.changes.length) return
    let changedState = revertChanges(this._state, this.changes[--this.changePosition])
    if (changedState == null) return
    this.state = changedState
  }
  redo() {
    if (this.changePosition >= this.changes.length) return
    let changedState = applyChanges(this._state, this.changes[this.changePosition++])
    if (changedState == null) return
    this.state = changedState
  }
}
