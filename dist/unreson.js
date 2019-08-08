"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cloneObject = cloneObject;
exports.setProxy = setProxy;
exports.StateObject = void 0;

var _yajsondiff = require("yajsondiff");

function cloneObject(object) {
  if (!object) return object;
  let cloned = object instanceof Array ? [] : {};

  for (let k in object) {
    let v = object[k];
    cloned[k] = v instanceof Object ? cloneObject(v) : v;
  }

  return cloned;
}

function setProxy(instance, proxyObject) {
  let handler = {
    get: function (obj, prop) {
      return obj[prop];
    },
    set: function (obj, prop, value) {
      let lastState = cloneObject(instance._state);

      if (value instanceof Object) {
        obj[prop] = setProxy(instance, value);
      } else {
        obj[prop] = value;
      }

      let change = (0, _yajsondiff.diff)(lastState, instance._state);

      if (change != null) {
        instance.add(change);
      }

      return true;
    }
  };
  return new Proxy(proxyObject ? proxyObject : {}, handler);
}

class StateObject {
  constructor(orig) {
    this.state = orig;
    this.changes = [];
    this.changePosition = 0;
  }

  set state(v) {
    this._state = setProxy(this, cloneObject(v));
  }

  get state() {
    return this._state;
  }

  stringify() {
    return JSON.stringify(this._state);
  }

  add(change) {
    this.changes.splice(this.changePosition++, this.changes.length, change);
  }

  undo() {
    if (this.changePosition <= 0 || this.changePosition > this.changes.length) return;
    let changedState = (0, _yajsondiff.revertChanges)(this._state, this.changes[--this.changePosition]);
    if (changedState == null) return;
    this.state = changedState;
  }

  redo() {
    if (this.changePosition >= this.changes.length) return;
    let changedState = (0, _yajsondiff.applyChanges)(this._state, this.changes[this.changePosition++]);
    if (changedState == null) return;
    this.state = changedState;
  }

}

exports.StateObject = StateObject;