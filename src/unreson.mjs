/**
 * A module for providing deep undo/redo state for dynamic JSON objects.
 * @module unreson
 * @author Ketchetwahmeegwun T. Southall / kts of kettek
 * @copyright 2019 Ketchetwahmeegwun T. Southall <kettek1@kettek.net>
 * @license lGPL-3.0
 */
import { EventEmitter } from 'events'
import { diff, applyChanges, revertChanges } from 'yajsondiff'

/** StateObject is a class that controls state for a provided data object. */
export class StateObject extends EventEmitter {
  /**
   * Sets up the passed object to be accessed and watched via state. Also sets
   * up changes-related properties.
   * @param {Object} obj
   */
  constructor(obj) {
    super()
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
   * @fires StateObject#undo
   */
  undo() {
    if (this.changePosition <= 0 || this.changePosition > this.changes.length) return
    let change = this.changes[--this.changePosition]
    let changedState = revertChanges(this._state, change)
    if (changedState == null) return
    this.state = changedState
    /**
     * Undo event.
     * 
     * @event StateObject#undo
     * @type {object} yajsondiff change
     */
    this.emit('undo', change)
  }

  /**
   * Redoes a change state based upon the current change position, changing the
   * underlying state and incrementing the change position.
   * @fires StateObject#redo
   */
  redo() {
    if (this.changePosition >= this.changes.length) return
    let change = this.changes[this.changePosition++]
    let changedState = applyChanges(this._state, change)
    if (changedState == null) return
    this.state = changedState
    /**
     * Redo event.
     * 
     * @event StateObject#redo
     * @type {object} yajsondiff change
     */
    this.emit('redo', change)
  }

  /**
   * Returns if the state can have undo() called.
   * @return {Boolean}
   */
  undoable() {
    if (this.changePosition == 0) return false
    return true
  }
  /**
   * Returns if the state can have redo() called.
   * @return {Boolean}
   */
  redoable() {
    if (this.changePosition >= this.changes.length) return false
    return true
  }
}

/**
 * Creates a deep proxy for a given object. Changes to state call `add(change)`
 * on the passed instance.
 * @param {StateObject} instance A StateObject instance
 * @param {Object} proxyObject The object from which to build a watched version
 * @returns {Proxy} A proxied version of the passed proxyObject
 * @fires StateObject#change
 */
export function setProxy(instance, proxyObject) {
  let handler = {
    get: function (obj, prop) {
      const value = Reflect.get(obj, prop)
      if (value instanceof Object) {
        return setProxy(instance, value)
      }
      return value
    },
    set: function (obj, prop, value) {
      let lastState = cloneObject(instance._state)
      Reflect.set(obj, prop, value)

      let change = diff(lastState, instance._state)
      if (change != null) {
        instance.add(change)
        /**
        * Change event.
        * 
        * @event StateObject#change
        * @type {object} yajsondiff change
        */
        instance.emit('change', change)
      }
      return true
    },
    deleteProperty: function(obj, prop) {
      Reflect.deleteProperty(obj, prop)
    },
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
