/**
 * A module for providing deep undo/redo state for dynamic JSON objects.
 * @module unreson
 * @author Ketchetwahmeegwun T. Southall / kts of kettek
 * @copyright 2019 Ketchetwahmeegwun T. Southall <kettek1@kettek.net>
 * @license lGPL-3.0
 */
import { diff, applyChanges, revertChanges } from 'yajsondiff'

/** StateObject is a class that controls state for a provided data object. */
export class StateObject {
  /**
   * Sets up the passed object to be accessed and watched via state. Also sets
   * up changes-related properties.
   * @param {Object} obj
   */
  constructor(obj) {
    this.state = obj
    this.changes = []
    this.changePosition = 0
  }

  /**
   * Sets up the internal state to match the provided object.
   * @param {Object} v
   */
  set state(v) {
    this._state = setProxy(this, cloneObject(v))
  }

  /**
   * Returns the internal state object.
   * @returns {Proxy}
   */
  get state() {
    return this._state
  }

  /**
   * Helper function that returns the internal state as a JSON string.
   * @returns {String} JSON string
   */
  stringify() {
    return JSON.stringify(this._state)
  }

  /**
   * Adds the given change based upon the current position, truncating the
   * array as needed.
   * @param change yajsondiff change object
   */
  add(change) {
    this.changes.splice(this.changePosition++, this.changes.length, change)
  }
  /**
   * Undoes a change state based upon the current change position, changing the
   * underlying state and decrementing the change position.
   */
  undo() {
    if (this.changePosition <= 0 || this.changePosition > this.changes.length) return
    let changedState = revertChanges(this._state, this.changes[--this.changePosition])
    if (changedState == null) return
    this.state = changedState
  }
  /**
   * Redoes a change state based upon the current change position, changing the
   * underlying state and incrementing the change position.
   */
  redo() {
    if (this.changePosition >= this.changes.length) return
    let changedState = applyChanges(this._state, this.changes[this.changePosition++])
    if (changedState == null) return
    this.state = changedState
  }
}

/**
 * Creates a deep proxy for a given object. Changes to state call `add(change)`
 * on the passed instance.
 * @param {StateObject} instance A StateObject instance
 * @param {Object} proxyObject The object from which to build a watched version
 * @returns {Proxy} A proxied version of the passed proxyObject
 */
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

/**
 * Deep clones a JavaScript object.
 * @param object A JavaScript Object, preferably JSON-safe
 */
export function cloneObject(object) {
  if (!object) return object

  let cloned = (object instanceof Array) ? [] : {};
  for (let k in object) {
    let v = object[k]
    cloned[k] = (v instanceof Object) ? cloneObject(v) : v
  }
  return cloned
}