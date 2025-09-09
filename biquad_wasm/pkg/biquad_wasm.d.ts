/* tslint:disable */
/* eslint-disable */
/**
* @param {Float64Array} time
* @param {Float64Array} current
* @param {Float64Array} potential
* @param {number} factor
* @param {number} sample_rate
* @param {number} cutoff_freq
* @returns {any}
*/
export function decimate_data(time: Float64Array, current: Float64Array, potential: Float64Array, factor: number, sample_rate: number, cutoff_freq: number): any;
/**
* @param {Float64Array} voltage
* @param {number} dt
* @param {number} input_freq
* @returns {number}
*/
export function get_amplitude(voltage: Float64Array, dt: number, input_freq: number): number;
/**
* @param {Float64Array} time
* @param {number} estart
* @param {number} ereverse
* @param {number} v
* @returns {Float64Array}
*/
export function dc_potential(time: Float64Array, estart: number, ereverse: number, v: number): Float64Array;
/**
* @param {Float64Array} time
* @param {Float64Array} current
* @param {number} input_freq
* @param {boolean} envelope
* @param {boolean} hanning
* @param {Float64Array} desired_harmonics
* @param {number} filter_pc
* @param {number} decimation_factor
* @param {number} sample_rate
* @returns {any}
*/
export function harmonics(time: Float64Array, current: Float64Array, input_freq: number, envelope: boolean, hanning: boolean, desired_harmonics: Float64Array, filter_pc: number, decimation_factor: number, sample_rate: number): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly decimate_data: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly get_amplitude: (a: number, b: number, c: number) => number;
  readonly dc_potential: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly harmonics: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
