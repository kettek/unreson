"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setProxy = setProxy;
exports.cloneObject = cloneObject;
exports.StateObject = void 0;

var _events = require("events");

var _yajsondiff = require("yajsondiff");

/**
 * A module for providing deep undo/redo state for dynamic JSON objects.
 * @module unreson
 * @author Ketchetwahmeegwun T. Southall / kts of kettek
 * @copyright 2019 Ketchetwahmeegwun T. Southall <kettek1@kettek.net>
 * @license lGPL-3.0
 */

/** StateObject is a class that controls state for a provided data object. */
class StateObject extends _events.EventEmitter {
  /**
   * Sets up the passed object to be accessed and watched via state. Also sets
   * up changes-related properties.
   * @param {Object} obj
   */
  constructor(obj) {
    super();
    this.state = obj;
    this.changes = [];
    this.changePosition = 0;
  }
  /**
   * Sets up the internal state to match the provided object.
   * @param {Object} v
   */


  set state(v) {
    this._state = setProxy(this, cloneObject(v));
  }
  /**
   * Returns the internal state object.
   * @returns {Proxy}
   */


  get state() {
    return this._state;
  }
  /**
   * Helper function that returns the internal state as a JSON string.
   * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify for replacer and space parameters.
   * @param {String|Number} replacer
   * @param {String|Number} space
   * @returns {String} JSON string
   */


  stringify(replacer = null, space = null) {
    return JSON.stringify(this._state, replacer, space);
  }
  /**
   * Caches the current state so multiple change steps can be recorded as a
   * single change. All changes made to the underlying state data will be
   * considered as a single undo/redo step once unqueue() is called.
   * @param {Object} [conf] Configuration object for adjusting queue logic.
   * @param {Object} [conf.emit=false] Emit change events for any changes made.
   */


  queue(conf = {}) {
    this._queueConfig = { ...{
        emit: false
      },
      ...conf
    };
    this._queuedState = cloneObject(this._state);
  }
  /**
   * Unqueues the current state against the state stored by an earlier call
   * to queue(). A change event will be emitted with the changes between the
   * state when queue() was called and the current underlying state.
   * @fires StateObject#change
   * @throws Will throw if queue() is not first called.
   */


  unqueue() {
    if (!this._queuedState) {
      throw new Error("unqueue() called without a prior call to queue()");
    }

    let change = (0, _yajsondiff.diff)(this._queuedState, this._state);

    if (change != null) {
      this.add(change);
      /**
      * Change event.
      * 
      * @event StateObject#change
      * @type {object} yajsondiff change
      */

      this.emit('change', change);
    }

    this._queuedState = null;
  }
  /**
   * Adds the given change based upon the current position, truncating the
   * array as needed.
   * @param change yajsondiff change object
   */


  add(change) {
    this.changes.splice(this.changePosition++, this.changes.length, change);
  }
  /**
   * Undoes a change state based upon the current change position, changing the
   * underlying state and decrementing the change position.
   * @fires StateObject#undo
   */


  undo() {
    if (this.changePosition <= 0 || this.changePosition > this.changes.length) return;
    let change = this.changes[--this.changePosition];
    let changedState = (0, _yajsondiff.revertChanges)(this._state, change);
    if (changedState == null) return;
    this.state = changedState;
    /**
     * Undo event.
     * 
     * @event StateObject#undo
     * @type {object} yajsondiff change
     */

    this.emit('undo', change);
  }
  /**
   * Redoes a change state based upon the current change position, changing the
   * underlying state and incrementing the change position.
   * @fires StateObject#redo
   */


  redo() {
    if (this.changePosition >= this.changes.length) return;
    let change = this.changes[this.changePosition++];
    let changedState = (0, _yajsondiff.applyChanges)(this._state, change);
    if (changedState == null) return;
    this.state = changedState;
    /**
     * Redo event.
     * 
     * @event StateObject#redo
     * @type {object} yajsondiff change
     */

    this.emit('redo', change);
  }
  /**
   * Returns if the state can have undo() called.
   * @return {Boolean}
   */


  undoable() {
    if (this.changePosition == 0) return false;
    return true;
  }
  /**
   * Returns if the state can have redo() called.
   * @return {Boolean}
   */


  redoable() {
    if (this.changePosition >= this.changes.length) return false;
    return true;
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


exports.StateObject = StateObject;

function setProxy(instance, proxyObject) {
  let handler = {
    get: function (obj, prop) {
      const desc = Object.getOwnPropertyDescriptor(obj, prop);
      const value = Reflect.get(obj, prop);

      if (value === null || typeof value !== 'object' && typeof value !== 'function') {
        return value;
      }

      if (desc && !desc.configurable) {
        if (desc.set && !desc.get) {
          return undefined;
        }

        if (!desc.writable) {
          return value;
        }
      }

      try {
        return setProxy(instance, value);
      } catch (error) {
        return value;
      }
    },
    set: function (obj, prop, value) {
      if (instance._queuedState && !instance._queueConfig.emit) {
        return Reflect.set(obj, prop, value);
      }

      let lastState = cloneObject(instance._state);
      let result = Reflect.set(obj, prop, value);
      let change = (0, _yajsondiff.diff)(lastState, instance._state);

      if (change != null) {
        if (!instance._queuedState) {
          instance.add(change);
        }
        /**
        * Change event.
        * 
        * @event StateObject#change
        * @type {object} yajsondiff change
        */


        instance.emit('change', change);
      }

      return result;
    }
  };
  return new Proxy(proxyObject ? proxyObject : {}, handler);
}
/**
 * Deep clones a JavaScript object.
 * @param object A JavaScript Object, preferably JSON-safe
 */


function cloneObject(object) {
  if (!object) return object;
  let cloned = object instanceof Array ? [] : {};

  for (let k in object) {
    let v = object[k];
    cloned[k] = v instanceof Object ? cloneObject(v) : v;
  }

  return cloned;
}