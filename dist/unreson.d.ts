/**
 * Creates a deep proxy for a given object. Changes to state call `add(change)`
 * on the passed instance.
 * @param {StateObject} instance A StateObject instance
 * @param {Object} proxyObject The object from which to build a watched version
 * @returns {Proxy} A proxied version of the passed proxyObject
 * @fires StateObject#change
 */
export function setProxy(instance: StateObject, proxyObject: any): ProxyConstructor;
/**
 * Deep clones a JavaScript object.
 * @param object A JavaScript Object, preferably JSON-safe
 */
export function cloneObject(object: any): any;
/**
* StateObject is a class that controls state for a provided data object.
*/
export class StateObject extends EventEmitter {
    /**
     * Sets up the passed object to be accessed and watched via state. Also sets
     * up changes-related properties.
     * @param {Object} obj The object from which to construct a stateful internal representation from.
     */
    constructor(obj: any);
    /**
     * Sets up the internal state to be a deep clone of the provided object.
     * @param {Object} v
     */
    set state(arg: ProxyConstructor);
    /**
     * Returns a proxy to the internal state object.
     * @returns {Proxy}
     */
    get state(): ProxyConstructor;
    changes: any[];
    changePosition: number;
    _frozen: boolean;
    _state: any;
    /**
     * Sets the internal state object to become immutable.
     */
    freeze(): void;
    /**
     * Sets the internal state object to become mutable.
     */
    thaw(): void;
    /**
     * Returns if the internal state object is immutable.
     */
    get frozen(): boolean;
    /**
     * Helper function that returns the internal state as a JSON string.
     * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify for replacer and space parameters.
     * @param {String[]|Number[]|null} replacer
     * @param {String|Number|null} space
     * @returns {String} JSON string
     */
    stringify(replacer?: string[] | number[] | null, space?: string | number | null): string;
    /**
     * Caches the current state so multiple change steps can be recorded as a
     * single change. All changes made to the underlying state data will be
     * considered as a single undo/redo step once unqueue() is called.
     * @param {Object} [conf] Configuration object for adjusting queue logic.
     * @param {Object} [conf.emit=false] Emit change events for any changes made.
     */
    queue(conf?: {
        emit?: any;
    }): void;
    _queueConfig: any;
    _queuedState: any;
    /**
     * Unqueues the current state against the state stored by an earlier call
     * to queue(). A change event will be emitted with the changes between the
     * state when queue() was called and the current underlying state.
     * @fires StateObject#change
     * @throws Will throw if queue() is not first called.
     */
    unqueue(): void;
    /**
     * Adds the given change based upon the current position, truncating the
     * array as needed.
     * @param change yajsondiff change object
     */
    add(change: any): void;
    /**
     * Undoes a change state based upon the current change position, changing the
     * underlying state and decrementing the change position.
     * @fires StateObject#undo
     */
    undo(): void;
    /**
     * Redoes a change state based upon the current change position, changing the
     * underlying state and incrementing the change position.
     * @fires StateObject#redo
     */
    redo(): void;
    /**
     * Returns a cloned state representing the state at the target change position.
     * @param {Number} pos Change state position to acquire a cloned object from.
     * @return {Object}
     */
    get(pos: number): any;
    /**
     * Returns if the state can have undo() called.
     * @return {Boolean}
     */
    undoable(): boolean;
    /**
     * Returns if the state can have redo() called.
     * @return {Boolean}
     */
    redoable(): boolean;
    /**
     * Restores the StateObject, including undo/redo history, from an object.
     * @param {Object} o A StateObject representation as created by the store() call.
     */
    restore(o: any): void;
    /**
     * Returns an Object representation of the full StateObject. The result of this
     * can be used to restore the full StateObject, including undo/redo history.
     * @returns {Object} A cloned representation of the entire StateObject structure.
     */
    store(): any;
    /**
     * Clears the undo/redo history, position information, and queue properties.
     * This renders the current state as the only state.
     */
    clear(): void;
}
import { EventEmitter } from "events";
