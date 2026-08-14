var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// .wrangler/tmp/bundle-kcVwvt/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// node_modules/unenv/dist/runtime/_internal/utils.mjs
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
__name(PerformanceEntry, "PerformanceEntry");
var PerformanceMark = /* @__PURE__ */ __name(class PerformanceMark2 extends PerformanceEntry {
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
}, "PerformanceMark");
var PerformanceMeasure = class extends PerformanceEntry {
  entryType = "measure";
};
__name(PerformanceMeasure, "PerformanceMeasure");
var PerformanceResourceTiming = class extends PerformanceEntry {
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
__name(PerformanceResourceTiming, "PerformanceResourceTiming");
var PerformanceObserverEntryList = class {
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
__name(PerformanceObserverEntryList, "PerformanceObserverEntryList");
var Performance = class {
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
__name(Performance, "Performance");
var PerformanceObserver = class {
  __unenv__ = true;
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
__name(PerformanceObserver, "PerformanceObserver");
__publicField(PerformanceObserver, "supportedEntryTypes", []);
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
import { Socket } from "node:net";
var ReadStream = class extends Socket {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  isRaw = false;
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
  isTTY = false;
};
__name(ReadStream, "ReadStream");

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
import { Socket as Socket2 } from "node:net";
var WriteStream = class extends Socket2 {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  clearLine(dir4, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env3) {
    return 1;
  }
  hasColors(count4, env3) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  columns = 80;
  rows = 24;
  isTTY = false;
};
__name(WriteStream, "WriteStream");

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class extends EventEmitter {
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  #cwd = "/";
  chdir(cwd3) {
    this.#cwd = cwd3;
  }
  cwd() {
    return this.#cwd;
  }
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return "";
  }
  get versions() {
    return {};
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  ref() {
  }
  unref() {
  }
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: () => 0 });
  mainModule = void 0;
  domain = void 0;
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};
__name(Process, "Process");

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var { exit, platform, nextTick } = getBuiltinModule(
  "node:process"
);
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  nextTick
});
var {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  finalization,
  features,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  on,
  off,
  once,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// .wrangler/tmp/pages-TJ9wkg/functionsWorker-0.3584173084810205.mjs
import { Writable as Writable2 } from "node:stream";
import { Socket as Socket3 } from "node:net";
import { Socket as Socket22 } from "node:net";
import { EventEmitter as EventEmitter2 } from "node:events";
import libDefault from "zlib";
var __create = Object.create;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp2 = /* @__PURE__ */ __name((obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value, "__defNormalProp");
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var __esm = /* @__PURE__ */ __name((fn, res) => /* @__PURE__ */ __name(function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
}, "__init"), "__esm");
var __commonJS = /* @__PURE__ */ __name((cb, mod) => /* @__PURE__ */ __name(function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
}, "__require"), "__commonJS");
var __copyProps = /* @__PURE__ */ __name((to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
}, "__copyProps");
var __toESM = /* @__PURE__ */ __name((mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
  mod
)), "__toESM");
var __publicField2 = /* @__PURE__ */ __name((obj, key, value) => {
  __defNormalProp2(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
}, "__publicField");
function stripCfConnectingIPHeader2(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader2, "stripCfConnectingIPHeader");
var init_strip_cf_connecting_ip_header = __esm({
  "../.wrangler/tmp/bundle-Qi8hJg/strip-cf-connecting-ip-header.js"() {
    __name2(stripCfConnectingIPHeader2, "stripCfConnectingIPHeader");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        return Reflect.apply(target, thisArg, [
          stripCfConnectingIPHeader2.apply(null, argArray)
        ]);
      }
    });
  }
});
function createNotImplementedError2(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError2, "createNotImplementedError");
function notImplemented2(name) {
  const fn = /* @__PURE__ */ __name2(() => {
    throw createNotImplementedError2(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented2, "notImplemented");
function notImplementedClass2(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass2, "notImplementedClass");
var init_utils = __esm({
  "../node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name2(createNotImplementedError2, "createNotImplementedError");
    __name2(notImplemented2, "notImplemented");
    __name2(notImplementedClass2, "notImplementedClass");
  }
});
var _timeOrigin2;
var _performanceNow2;
var nodeTiming2;
var PerformanceEntry2;
var PerformanceMark3;
var PerformanceMeasure2;
var PerformanceResourceTiming2;
var PerformanceObserverEntryList2;
var Performance2;
var PerformanceObserver2;
var performance2;
var init_performance = __esm({
  "../node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    _timeOrigin2 = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow2 = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin2;
    nodeTiming2 = {
      name: "node",
      entryType: "node",
      startTime: 0,
      duration: 0,
      nodeStart: 0,
      v8Start: 0,
      bootstrapComplete: 0,
      environment: 0,
      loopStart: 0,
      loopExit: 0,
      idleTime: 0,
      uvMetricsInfo: {
        loopCount: 0,
        events: 0,
        eventsWaiting: 0
      },
      detail: void 0,
      toJSON() {
        return this;
      }
    };
    PerformanceEntry2 = /* @__PURE__ */ __name(class {
      __unenv__ = true;
      detail;
      entryType = "event";
      name;
      startTime;
      constructor(name, options) {
        this.name = name;
        this.startTime = options?.startTime || _performanceNow2();
        this.detail = options?.detail;
      }
      get duration() {
        return _performanceNow2() - this.startTime;
      }
      toJSON() {
        return {
          name: this.name,
          entryType: this.entryType,
          startTime: this.startTime,
          duration: this.duration,
          detail: this.detail
        };
      }
    }, "PerformanceEntry");
    __name2(PerformanceEntry2, "PerformanceEntry");
    PerformanceMark3 = /* @__PURE__ */ __name2(/* @__PURE__ */ __name(class PerformanceMark2 extends PerformanceEntry2 {
      entryType = "mark";
      constructor() {
        super(...arguments);
      }
      get duration() {
        return 0;
      }
    }, "PerformanceMark2"), "PerformanceMark");
    PerformanceMeasure2 = /* @__PURE__ */ __name(class extends PerformanceEntry2 {
      entryType = "measure";
    }, "PerformanceMeasure");
    __name2(PerformanceMeasure2, "PerformanceMeasure");
    PerformanceResourceTiming2 = /* @__PURE__ */ __name(class extends PerformanceEntry2 {
      entryType = "resource";
      serverTiming = [];
      connectEnd = 0;
      connectStart = 0;
      decodedBodySize = 0;
      domainLookupEnd = 0;
      domainLookupStart = 0;
      encodedBodySize = 0;
      fetchStart = 0;
      initiatorType = "";
      name = "";
      nextHopProtocol = "";
      redirectEnd = 0;
      redirectStart = 0;
      requestStart = 0;
      responseEnd = 0;
      responseStart = 0;
      secureConnectionStart = 0;
      startTime = 0;
      transferSize = 0;
      workerStart = 0;
      responseStatus = 0;
    }, "PerformanceResourceTiming");
    __name2(PerformanceResourceTiming2, "PerformanceResourceTiming");
    PerformanceObserverEntryList2 = /* @__PURE__ */ __name(class {
      __unenv__ = true;
      getEntries() {
        return [];
      }
      getEntriesByName(_name, _type) {
        return [];
      }
      getEntriesByType(type) {
        return [];
      }
    }, "PerformanceObserverEntryList");
    __name2(PerformanceObserverEntryList2, "PerformanceObserverEntryList");
    Performance2 = /* @__PURE__ */ __name(class {
      __unenv__ = true;
      timeOrigin = _timeOrigin2;
      eventCounts = /* @__PURE__ */ new Map();
      _entries = [];
      _resourceTimingBufferSize = 0;
      navigation = void 0;
      timing = void 0;
      timerify(_fn, _options) {
        throw createNotImplementedError2("Performance.timerify");
      }
      get nodeTiming() {
        return nodeTiming2;
      }
      eventLoopUtilization() {
        return {};
      }
      markResourceTiming() {
        return new PerformanceResourceTiming2("");
      }
      onresourcetimingbufferfull = null;
      now() {
        if (this.timeOrigin === _timeOrigin2) {
          return _performanceNow2();
        }
        return Date.now() - this.timeOrigin;
      }
      clearMarks(markName) {
        this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type) {
        return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
      }
      getEntriesByType(type) {
        return this._entries.filter((e) => e.entryType === type);
      }
      mark(name, options) {
        const entry = new PerformanceMark3(name, options);
        this._entries.push(entry);
        return entry;
      }
      measure(measureName, startOrMeasureOptions, endMark) {
        let start;
        let end;
        if (typeof startOrMeasureOptions === "string") {
          start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
          end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
        } else {
          start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
          end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
        }
        const entry = new PerformanceMeasure2(measureName, {
          startTime: start,
          detail: {
            start,
            end
          }
        });
        this._entries.push(entry);
        return entry;
      }
      setResourceTimingBufferSize(maxSize) {
        this._resourceTimingBufferSize = maxSize;
      }
      addEventListener(type, listener, options) {
        throw createNotImplementedError2("Performance.addEventListener");
      }
      removeEventListener(type, listener, options) {
        throw createNotImplementedError2("Performance.removeEventListener");
      }
      dispatchEvent(event) {
        throw createNotImplementedError2("Performance.dispatchEvent");
      }
      toJSON() {
        return this;
      }
    }, "Performance");
    __name2(Performance2, "Performance");
    PerformanceObserver2 = /* @__PURE__ */ __name(class {
      __unenv__ = true;
      _callback = null;
      constructor(callback) {
        this._callback = callback;
      }
      takeRecords() {
        return [];
      }
      disconnect() {
        throw createNotImplementedError2("PerformanceObserver.disconnect");
      }
      observe(options) {
        throw createNotImplementedError2("PerformanceObserver.observe");
      }
      bind(fn) {
        return fn;
      }
      runInAsyncScope(fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      asyncId() {
        return 0;
      }
      triggerAsyncId() {
        return 0;
      }
      emitDestroy() {
        return this;
      }
    }, "PerformanceObserver");
    __name2(PerformanceObserver2, "PerformanceObserver");
    __publicField2(PerformanceObserver2, "supportedEntryTypes", []);
    performance2 = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance2();
  }
});
var init_perf_hooks = __esm({
  "../node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_performance();
  }
});
var init_performance2 = __esm({
  "../node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    globalThis.performance = performance2;
    globalThis.Performance = Performance2;
    globalThis.PerformanceEntry = PerformanceEntry2;
    globalThis.PerformanceMark = PerformanceMark3;
    globalThis.PerformanceMeasure = PerformanceMeasure2;
    globalThis.PerformanceObserver = PerformanceObserver2;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList2;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming2;
  }
});
var noop_default2;
var init_noop = __esm({
  "../node_modules/unenv/dist/runtime/mock/noop.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    noop_default2 = Object.assign(() => {
    }, { __unenv__: true });
  }
});
var _console2;
var _ignoreErrors2;
var _stderr2;
var _stdout2;
var log3;
var info3;
var trace3;
var debug3;
var table3;
var error3;
var warn3;
var createTask3;
var clear3;
var count3;
var countReset3;
var dir3;
var dirxml3;
var group3;
var groupEnd3;
var groupCollapsed3;
var profile3;
var profileEnd3;
var time3;
var timeEnd3;
var timeLog3;
var timeStamp3;
var Console2;
var _times2;
var _stdoutErrorHandler2;
var _stderrErrorHandler2;
var init_console = __esm({
  "../node_modules/unenv/dist/runtime/node/console.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_noop();
    init_utils();
    _console2 = globalThis.console;
    _ignoreErrors2 = true;
    _stderr2 = new Writable2();
    _stdout2 = new Writable2();
    log3 = _console2?.log ?? noop_default2;
    info3 = _console2?.info ?? log3;
    trace3 = _console2?.trace ?? info3;
    debug3 = _console2?.debug ?? log3;
    table3 = _console2?.table ?? log3;
    error3 = _console2?.error ?? log3;
    warn3 = _console2?.warn ?? error3;
    createTask3 = _console2?.createTask ?? /* @__PURE__ */ notImplemented2("console.createTask");
    clear3 = _console2?.clear ?? noop_default2;
    count3 = _console2?.count ?? noop_default2;
    countReset3 = _console2?.countReset ?? noop_default2;
    dir3 = _console2?.dir ?? noop_default2;
    dirxml3 = _console2?.dirxml ?? noop_default2;
    group3 = _console2?.group ?? noop_default2;
    groupEnd3 = _console2?.groupEnd ?? noop_default2;
    groupCollapsed3 = _console2?.groupCollapsed ?? noop_default2;
    profile3 = _console2?.profile ?? noop_default2;
    profileEnd3 = _console2?.profileEnd ?? noop_default2;
    time3 = _console2?.time ?? noop_default2;
    timeEnd3 = _console2?.timeEnd ?? noop_default2;
    timeLog3 = _console2?.timeLog ?? noop_default2;
    timeStamp3 = _console2?.timeStamp ?? noop_default2;
    Console2 = _console2?.Console ?? /* @__PURE__ */ notImplementedClass2("console.Console");
    _times2 = /* @__PURE__ */ new Map();
    _stdoutErrorHandler2 = noop_default2;
    _stderrErrorHandler2 = noop_default2;
  }
});
var workerdConsole2;
var assert3;
var clear22;
var context2;
var count22;
var countReset22;
var createTask22;
var debug22;
var dir22;
var dirxml22;
var error22;
var group22;
var groupCollapsed22;
var groupEnd22;
var info22;
var log22;
var profile22;
var profileEnd22;
var table22;
var time22;
var timeEnd22;
var timeLog22;
var timeStamp22;
var trace22;
var warn22;
var console_default2;
var init_console2 = __esm({
  "../node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_console();
    workerdConsole2 = globalThis["console"];
    ({
      assert: assert3,
      clear: clear22,
      context: (
        // @ts-expect-error undocumented public API
        context2
      ),
      count: count22,
      countReset: countReset22,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask22
      ),
      debug: debug22,
      dir: dir22,
      dirxml: dirxml22,
      error: error22,
      group: group22,
      groupCollapsed: groupCollapsed22,
      groupEnd: groupEnd22,
      info: info22,
      log: log22,
      profile: profile22,
      profileEnd: profileEnd22,
      table: table22,
      time: time22,
      timeEnd: timeEnd22,
      timeLog: timeLog22,
      timeStamp: timeStamp22,
      trace: trace22,
      warn: warn22
    } = workerdConsole2);
    Object.assign(workerdConsole2, {
      Console: Console2,
      _ignoreErrors: _ignoreErrors2,
      _stderr: _stderr2,
      _stderrErrorHandler: _stderrErrorHandler2,
      _stdout: _stdout2,
      _stdoutErrorHandler: _stdoutErrorHandler2,
      _times: _times2
    });
    console_default2 = workerdConsole2;
  }
});
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console = __esm({
  "../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console"() {
    init_console2();
    globalThis.console = console_default2;
  }
});
var hrtime4;
var init_hrtime = __esm({
  "../node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    hrtime4 = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name2(/* @__PURE__ */ __name(function hrtime22(startTime) {
      const now = Date.now();
      const seconds = Math.trunc(now / 1e3);
      const nanos = now % 1e3 * 1e6;
      if (startTime) {
        let diffSeconds = seconds - startTime[0];
        let diffNanos = nanos - startTime[0];
        if (diffNanos < 0) {
          diffSeconds = diffSeconds - 1;
          diffNanos = 1e9 + diffNanos;
        }
        return [diffSeconds, diffNanos];
      }
      return [seconds, nanos];
    }, "hrtime2"), "hrtime"), { bigint: /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function bigint2() {
      return BigInt(Date.now() * 1e6);
    }, "bigint"), "bigint") });
  }
});
var ReadStream2;
var init_read_stream = __esm({
  "../node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ReadStream2 = /* @__PURE__ */ __name(class extends Socket3 {
      fd;
      constructor(fd) {
        super();
        this.fd = fd;
      }
      isRaw = false;
      setRawMode(mode) {
        this.isRaw = mode;
        return this;
      }
      isTTY = false;
    }, "ReadStream");
    __name2(ReadStream2, "ReadStream");
  }
});
var WriteStream2;
var init_write_stream = __esm({
  "../node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WriteStream2 = /* @__PURE__ */ __name(class extends Socket22 {
      fd;
      constructor(fd) {
        super();
        this.fd = fd;
      }
      clearLine(dir32, callback) {
        callback && callback();
        return false;
      }
      clearScreenDown(callback) {
        callback && callback();
        return false;
      }
      cursorTo(x, y, callback) {
        callback && typeof callback === "function" && callback();
        return false;
      }
      moveCursor(dx, dy, callback) {
        callback && callback();
        return false;
      }
      getColorDepth(env22) {
        return 1;
      }
      hasColors(count32, env22) {
        return false;
      }
      getWindowSize() {
        return [this.columns, this.rows];
      }
      columns = 80;
      rows = 24;
      isTTY = false;
    }, "WriteStream");
    __name2(WriteStream2, "WriteStream");
  }
});
var init_tty = __esm({
  "../node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});
var Process2;
var init_process = __esm({
  "../node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tty();
    init_utils();
    Process2 = /* @__PURE__ */ __name(class extends EventEmitter2 {
      env;
      hrtime;
      nextTick;
      constructor(impl) {
        super();
        this.env = impl.env;
        this.hrtime = impl.hrtime;
        this.nextTick = impl.nextTick;
        for (const prop of [...Object.getOwnPropertyNames(Process2.prototype), ...Object.getOwnPropertyNames(EventEmitter2.prototype)]) {
          const value = this[prop];
          if (typeof value === "function") {
            this[prop] = value.bind(this);
          }
        }
      }
      emitWarning(warning, type, code) {
        console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
      }
      emit(...args) {
        return super.emit(...args);
      }
      listeners(eventName) {
        return super.listeners(eventName);
      }
      #stdin;
      #stdout;
      #stderr;
      get stdin() {
        return this.#stdin ??= new ReadStream2(0);
      }
      get stdout() {
        return this.#stdout ??= new WriteStream2(1);
      }
      get stderr() {
        return this.#stderr ??= new WriteStream2(2);
      }
      #cwd = "/";
      chdir(cwd22) {
        this.#cwd = cwd22;
      }
      cwd() {
        return this.#cwd;
      }
      arch = "";
      platform = "";
      argv = [];
      argv0 = "";
      execArgv = [];
      execPath = "";
      title = "";
      pid = 200;
      ppid = 100;
      get version() {
        return "";
      }
      get versions() {
        return {};
      }
      get allowedNodeEnvironmentFlags() {
        return /* @__PURE__ */ new Set();
      }
      get sourceMapsEnabled() {
        return false;
      }
      get debugPort() {
        return 0;
      }
      get throwDeprecation() {
        return false;
      }
      get traceDeprecation() {
        return false;
      }
      get features() {
        return {};
      }
      get release() {
        return {};
      }
      get connected() {
        return false;
      }
      get config() {
        return {};
      }
      get moduleLoadList() {
        return [];
      }
      constrainedMemory() {
        return 0;
      }
      availableMemory() {
        return 0;
      }
      uptime() {
        return 0;
      }
      resourceUsage() {
        return {};
      }
      ref() {
      }
      unref() {
      }
      umask() {
        throw createNotImplementedError2("process.umask");
      }
      getBuiltinModule() {
        return void 0;
      }
      getActiveResourcesInfo() {
        throw createNotImplementedError2("process.getActiveResourcesInfo");
      }
      exit() {
        throw createNotImplementedError2("process.exit");
      }
      reallyExit() {
        throw createNotImplementedError2("process.reallyExit");
      }
      kill() {
        throw createNotImplementedError2("process.kill");
      }
      abort() {
        throw createNotImplementedError2("process.abort");
      }
      dlopen() {
        throw createNotImplementedError2("process.dlopen");
      }
      setSourceMapsEnabled() {
        throw createNotImplementedError2("process.setSourceMapsEnabled");
      }
      loadEnvFile() {
        throw createNotImplementedError2("process.loadEnvFile");
      }
      disconnect() {
        throw createNotImplementedError2("process.disconnect");
      }
      cpuUsage() {
        throw createNotImplementedError2("process.cpuUsage");
      }
      setUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError2("process.setUncaughtExceptionCaptureCallback");
      }
      hasUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError2("process.hasUncaughtExceptionCaptureCallback");
      }
      initgroups() {
        throw createNotImplementedError2("process.initgroups");
      }
      openStdin() {
        throw createNotImplementedError2("process.openStdin");
      }
      assert() {
        throw createNotImplementedError2("process.assert");
      }
      binding() {
        throw createNotImplementedError2("process.binding");
      }
      permission = { has: /* @__PURE__ */ notImplemented2("process.permission.has") };
      report = {
        directory: "",
        filename: "",
        signal: "SIGUSR2",
        compact: false,
        reportOnFatalError: false,
        reportOnSignal: false,
        reportOnUncaughtException: false,
        getReport: /* @__PURE__ */ notImplemented2("process.report.getReport"),
        writeReport: /* @__PURE__ */ notImplemented2("process.report.writeReport")
      };
      finalization = {
        register: /* @__PURE__ */ notImplemented2("process.finalization.register"),
        unregister: /* @__PURE__ */ notImplemented2("process.finalization.unregister"),
        registerBeforeExit: /* @__PURE__ */ notImplemented2("process.finalization.registerBeforeExit")
      };
      memoryUsage = Object.assign(() => ({
        arrayBuffers: 0,
        rss: 0,
        external: 0,
        heapTotal: 0,
        heapUsed: 0
      }), { rss: () => 0 });
      mainModule = void 0;
      domain = void 0;
      send = void 0;
      exitCode = void 0;
      channel = void 0;
      getegid = void 0;
      geteuid = void 0;
      getgid = void 0;
      getgroups = void 0;
      getuid = void 0;
      setegid = void 0;
      seteuid = void 0;
      setgid = void 0;
      setgroups = void 0;
      setuid = void 0;
      _events = void 0;
      _eventsCount = void 0;
      _exiting = void 0;
      _maxListeners = void 0;
      _debugEnd = void 0;
      _debugProcess = void 0;
      _fatalException = void 0;
      _getActiveHandles = void 0;
      _getActiveRequests = void 0;
      _kill = void 0;
      _preload_modules = void 0;
      _rawDebug = void 0;
      _startProfilerIdleNotifier = void 0;
      _stopProfilerIdleNotifier = void 0;
      _tickCallback = void 0;
      _disconnect = void 0;
      _handleQueue = void 0;
      _pendingMessage = void 0;
      _channel = void 0;
      _send = void 0;
      _linkedBinding = void 0;
    }, "Process");
    __name2(Process2, "Process");
  }
});
var globalProcess2;
var getBuiltinModule2;
var exit2;
var platform2;
var nextTick2;
var unenvProcess2;
var abort2;
var addListener2;
var allowedNodeEnvironmentFlags2;
var hasUncaughtExceptionCaptureCallback2;
var setUncaughtExceptionCaptureCallback2;
var loadEnvFile2;
var sourceMapsEnabled2;
var arch2;
var argv2;
var argv02;
var chdir2;
var config2;
var connected2;
var constrainedMemory2;
var availableMemory2;
var cpuUsage2;
var cwd2;
var debugPort2;
var dlopen2;
var disconnect2;
var emit2;
var emitWarning2;
var env2;
var eventNames2;
var execArgv2;
var execPath2;
var finalization2;
var features2;
var getActiveResourcesInfo2;
var getMaxListeners2;
var hrtime32;
var kill2;
var listeners2;
var listenerCount2;
var memoryUsage2;
var on2;
var off2;
var once2;
var pid2;
var ppid2;
var prependListener2;
var prependOnceListener2;
var rawListeners2;
var release2;
var removeAllListeners2;
var removeListener2;
var report2;
var resourceUsage2;
var setMaxListeners2;
var setSourceMapsEnabled2;
var stderr2;
var stdin2;
var stdout2;
var title2;
var throwDeprecation2;
var traceDeprecation2;
var umask2;
var uptime2;
var version2;
var versions2;
var domain2;
var initgroups2;
var moduleLoadList2;
var reallyExit2;
var openStdin2;
var assert22;
var binding2;
var send2;
var exitCode2;
var channel2;
var getegid2;
var geteuid2;
var getgid2;
var getgroups2;
var getuid2;
var setegid2;
var seteuid2;
var setgid2;
var setgroups2;
var setuid2;
var permission2;
var mainModule2;
var _events2;
var _eventsCount2;
var _exiting2;
var _maxListeners2;
var _debugEnd2;
var _debugProcess2;
var _fatalException2;
var _getActiveHandles2;
var _getActiveRequests2;
var _kill2;
var _preload_modules2;
var _rawDebug2;
var _startProfilerIdleNotifier2;
var _stopProfilerIdleNotifier2;
var _tickCallback2;
var _disconnect2;
var _handleQueue2;
var _pendingMessage2;
var _channel2;
var _send2;
var _linkedBinding2;
var _process2;
var process_default2;
var init_process2 = __esm({
  "../node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess2 = globalThis["process"];
    getBuiltinModule2 = globalProcess2.getBuiltinModule;
    ({ exit: exit2, platform: platform2, nextTick: nextTick2 } = getBuiltinModule2(
      "node:process"
    ));
    unenvProcess2 = new Process2({
      env: globalProcess2.env,
      hrtime: hrtime4,
      nextTick: nextTick2
    });
    ({
      abort: abort2,
      addListener: addListener2,
      allowedNodeEnvironmentFlags: allowedNodeEnvironmentFlags2,
      hasUncaughtExceptionCaptureCallback: hasUncaughtExceptionCaptureCallback2,
      setUncaughtExceptionCaptureCallback: setUncaughtExceptionCaptureCallback2,
      loadEnvFile: loadEnvFile2,
      sourceMapsEnabled: sourceMapsEnabled2,
      arch: arch2,
      argv: argv2,
      argv0: argv02,
      chdir: chdir2,
      config: config2,
      connected: connected2,
      constrainedMemory: constrainedMemory2,
      availableMemory: availableMemory2,
      cpuUsage: cpuUsage2,
      cwd: cwd2,
      debugPort: debugPort2,
      dlopen: dlopen2,
      disconnect: disconnect2,
      emit: emit2,
      emitWarning: emitWarning2,
      env: env2,
      eventNames: eventNames2,
      execArgv: execArgv2,
      execPath: execPath2,
      finalization: finalization2,
      features: features2,
      getActiveResourcesInfo: getActiveResourcesInfo2,
      getMaxListeners: getMaxListeners2,
      hrtime: hrtime32,
      kill: kill2,
      listeners: listeners2,
      listenerCount: listenerCount2,
      memoryUsage: memoryUsage2,
      on: on2,
      off: off2,
      once: once2,
      pid: pid2,
      ppid: ppid2,
      prependListener: prependListener2,
      prependOnceListener: prependOnceListener2,
      rawListeners: rawListeners2,
      release: release2,
      removeAllListeners: removeAllListeners2,
      removeListener: removeListener2,
      report: report2,
      resourceUsage: resourceUsage2,
      setMaxListeners: setMaxListeners2,
      setSourceMapsEnabled: setSourceMapsEnabled2,
      stderr: stderr2,
      stdin: stdin2,
      stdout: stdout2,
      title: title2,
      throwDeprecation: throwDeprecation2,
      traceDeprecation: traceDeprecation2,
      umask: umask2,
      uptime: uptime2,
      version: version2,
      versions: versions2,
      domain: domain2,
      initgroups: initgroups2,
      moduleLoadList: moduleLoadList2,
      reallyExit: reallyExit2,
      openStdin: openStdin2,
      assert: assert22,
      binding: binding2,
      send: send2,
      exitCode: exitCode2,
      channel: channel2,
      getegid: getegid2,
      geteuid: geteuid2,
      getgid: getgid2,
      getgroups: getgroups2,
      getuid: getuid2,
      setegid: setegid2,
      seteuid: seteuid2,
      setgid: setgid2,
      setgroups: setgroups2,
      setuid: setuid2,
      permission: permission2,
      mainModule: mainModule2,
      _events: _events2,
      _eventsCount: _eventsCount2,
      _exiting: _exiting2,
      _maxListeners: _maxListeners2,
      _debugEnd: _debugEnd2,
      _debugProcess: _debugProcess2,
      _fatalException: _fatalException2,
      _getActiveHandles: _getActiveHandles2,
      _getActiveRequests: _getActiveRequests2,
      _kill: _kill2,
      _preload_modules: _preload_modules2,
      _rawDebug: _rawDebug2,
      _startProfilerIdleNotifier: _startProfilerIdleNotifier2,
      _stopProfilerIdleNotifier: _stopProfilerIdleNotifier2,
      _tickCallback: _tickCallback2,
      _disconnect: _disconnect2,
      _handleQueue: _handleQueue2,
      _pendingMessage: _pendingMessage2,
      _channel: _channel2,
      _send: _send2,
      _linkedBinding: _linkedBinding2
    } = unenvProcess2);
    _process2 = {
      abort: abort2,
      addListener: addListener2,
      allowedNodeEnvironmentFlags: allowedNodeEnvironmentFlags2,
      hasUncaughtExceptionCaptureCallback: hasUncaughtExceptionCaptureCallback2,
      setUncaughtExceptionCaptureCallback: setUncaughtExceptionCaptureCallback2,
      loadEnvFile: loadEnvFile2,
      sourceMapsEnabled: sourceMapsEnabled2,
      arch: arch2,
      argv: argv2,
      argv0: argv02,
      chdir: chdir2,
      config: config2,
      connected: connected2,
      constrainedMemory: constrainedMemory2,
      availableMemory: availableMemory2,
      cpuUsage: cpuUsage2,
      cwd: cwd2,
      debugPort: debugPort2,
      dlopen: dlopen2,
      disconnect: disconnect2,
      emit: emit2,
      emitWarning: emitWarning2,
      env: env2,
      eventNames: eventNames2,
      execArgv: execArgv2,
      execPath: execPath2,
      exit: exit2,
      finalization: finalization2,
      features: features2,
      getBuiltinModule: getBuiltinModule2,
      getActiveResourcesInfo: getActiveResourcesInfo2,
      getMaxListeners: getMaxListeners2,
      hrtime: hrtime32,
      kill: kill2,
      listeners: listeners2,
      listenerCount: listenerCount2,
      memoryUsage: memoryUsage2,
      nextTick: nextTick2,
      on: on2,
      off: off2,
      once: once2,
      pid: pid2,
      platform: platform2,
      ppid: ppid2,
      prependListener: prependListener2,
      prependOnceListener: prependOnceListener2,
      rawListeners: rawListeners2,
      release: release2,
      removeAllListeners: removeAllListeners2,
      removeListener: removeListener2,
      report: report2,
      resourceUsage: resourceUsage2,
      setMaxListeners: setMaxListeners2,
      setSourceMapsEnabled: setSourceMapsEnabled2,
      stderr: stderr2,
      stdin: stdin2,
      stdout: stdout2,
      title: title2,
      throwDeprecation: throwDeprecation2,
      traceDeprecation: traceDeprecation2,
      umask: umask2,
      uptime: uptime2,
      version: version2,
      versions: versions2,
      // @ts-expect-error old API
      domain: domain2,
      initgroups: initgroups2,
      moduleLoadList: moduleLoadList2,
      reallyExit: reallyExit2,
      openStdin: openStdin2,
      assert: assert22,
      binding: binding2,
      send: send2,
      exitCode: exitCode2,
      channel: channel2,
      getegid: getegid2,
      geteuid: geteuid2,
      getgid: getgid2,
      getgroups: getgroups2,
      getuid: getuid2,
      setegid: setegid2,
      seteuid: seteuid2,
      setgid: setgid2,
      setgroups: setgroups2,
      setuid: setuid2,
      permission: permission2,
      mainModule: mainModule2,
      _events: _events2,
      _eventsCount: _eventsCount2,
      _exiting: _exiting2,
      _maxListeners: _maxListeners2,
      _debugEnd: _debugEnd2,
      _debugProcess: _debugProcess2,
      _fatalException: _fatalException2,
      _getActiveHandles: _getActiveHandles2,
      _getActiveRequests: _getActiveRequests2,
      _kill: _kill2,
      _preload_modules: _preload_modules2,
      _rawDebug: _rawDebug2,
      _startProfilerIdleNotifier: _startProfilerIdleNotifier2,
      _stopProfilerIdleNotifier: _stopProfilerIdleNotifier2,
      _tickCallback: _tickCallback2,
      _disconnect: _disconnect2,
      _handleQueue: _handleQueue2,
      _pendingMessage: _pendingMessage2,
      _channel: _channel2,
      _send: _send2,
      _linkedBinding: _linkedBinding2
    };
    process_default2 = _process2;
  }
});
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default2;
  }
});
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };
}
__name(corsHeaders, "corsHeaders");
async function onRequestOptions() {
  return new Response("", { status: 200, headers: corsHeaders() });
}
__name(onRequestOptions, "onRequestOptions");
async function onRequestPost(context22) {
  const { request, env: env22 } = context22;
  const headers = corsHeaders();
  const GROQ_API_KEY = env22.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: "Server is missing GROQ_API_KEY environment variable." }), { status: 500, headers });
  }
  try {
    const { message, history } = await request.json();
    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ error: "Missing 'message'." }), { status: 400, headers });
    }
    const messages = [
      {
        role: "system",
        content: "You are the DiasporaLink Assistant, a helpful guide inside a community app for the global diaspora \u2014 students, graduates, and professionals living abroad. Help with questions about using the app, general advice on studying/working abroad, scholarships, visas, and community life. Be warm, concise, and practical. You are not a lawyer or immigration official \u2014 for official document or visa decisions, always suggest they contact their embassy through the app's Embassy tab. Never give medical, legal, or financial advice as if it were certain \u2014 offer general information and suggest a qualified professional for anything serious."
      },
      ...Array.isArray(history) ? history.slice(-6) : [],
      { role: "user", content: message.trim() }
    ];
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.6,
        max_tokens: 600
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq API error:", res.status, errText);
      return new Response(JSON.stringify({ error: "AI service returned an error (" + res.status + ")." }), { status: 502, headers });
    }
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a reply just now.";
    return new Response(JSON.stringify({ reply }), { status: 200, headers });
  } catch (err) {
    console.error("Error in ask-assistant:", err.message);
    return new Response(JSON.stringify({ error: "Failed to get a response: " + err.message }), { status: 500, headers });
  }
}
__name(onRequestPost, "onRequestPost");
var init_ask_assistant = __esm({
  "ask-assistant.js"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name2(corsHeaders, "corsHeaders");
    __name2(onRequestOptions, "onRequestOptions");
    __name2(onRequestPost, "onRequestPost");
  }
});
var require_crypt = __commonJS({
  "../node_modules/crypt/crypt.js"(exports, module) {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    (function() {
      var base64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", crypt = {
        // Bit-wise rotation left
        rotl: function(n, b) {
          return n << b | n >>> 32 - b;
        },
        // Bit-wise rotation right
        rotr: function(n, b) {
          return n << 32 - b | n >>> b;
        },
        // Swap big-endian to little-endian and vice versa
        endian: function(n) {
          if (n.constructor == Number) {
            return crypt.rotl(n, 8) & 16711935 | crypt.rotl(n, 24) & 4278255360;
          }
          for (var i = 0; i < n.length; i++)
            n[i] = crypt.endian(n[i]);
          return n;
        },
        // Generate an array of any length of random bytes
        randomBytes: function(n) {
          for (var bytes = []; n > 0; n--)
            bytes.push(Math.floor(Math.random() * 256));
          return bytes;
        },
        // Convert a byte array to big-endian 32-bit words
        bytesToWords: function(bytes) {
          for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
            words[b >>> 5] |= bytes[i] << 24 - b % 32;
          return words;
        },
        // Convert big-endian 32-bit words to a byte array
        wordsToBytes: function(words) {
          for (var bytes = [], b = 0; b < words.length * 32; b += 8)
            bytes.push(words[b >>> 5] >>> 24 - b % 32 & 255);
          return bytes;
        },
        // Convert a byte array to a hex string
        bytesToHex: function(bytes) {
          for (var hex = [], i = 0; i < bytes.length; i++) {
            hex.push((bytes[i] >>> 4).toString(16));
            hex.push((bytes[i] & 15).toString(16));
          }
          return hex.join("");
        },
        // Convert a hex string to a byte array
        hexToBytes: function(hex) {
          for (var bytes = [], c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
          return bytes;
        },
        // Convert a byte array to a base-64 string
        bytesToBase64: function(bytes) {
          for (var base64 = [], i = 0; i < bytes.length; i += 3) {
            var triplet = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
            for (var j = 0; j < 4; j++)
              if (i * 8 + j * 6 <= bytes.length * 8)
                base64.push(base64map.charAt(triplet >>> 6 * (3 - j) & 63));
              else
                base64.push("=");
          }
          return base64.join("");
        },
        // Convert a base-64 string to a byte array
        base64ToBytes: function(base64) {
          base64 = base64.replace(/[^A-Z0-9+\/]/ig, "");
          for (var bytes = [], i = 0, imod4 = 0; i < base64.length; imod4 = ++i % 4) {
            if (imod4 == 0)
              continue;
            bytes.push((base64map.indexOf(base64.charAt(i - 1)) & Math.pow(2, -2 * imod4 + 8) - 1) << imod4 * 2 | base64map.indexOf(base64.charAt(i)) >>> 6 - imod4 * 2);
          }
          return bytes;
        }
      };
      module.exports = crypt;
    })();
  }
});
var require_charenc = __commonJS({
  "../node_modules/charenc/charenc.js"(exports, module) {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var charenc = {
      // UTF-8 encoding
      utf8: {
        // Convert a string to a byte array
        stringToBytes: function(str) {
          return charenc.bin.stringToBytes(unescape(encodeURIComponent(str)));
        },
        // Convert a byte array to a string
        bytesToString: function(bytes) {
          return decodeURIComponent(escape(charenc.bin.bytesToString(bytes)));
        }
      },
      // Binary encoding
      bin: {
        // Convert a string to a byte array
        stringToBytes: function(str) {
          for (var bytes = [], i = 0; i < str.length; i++)
            bytes.push(str.charCodeAt(i) & 255);
          return bytes;
        },
        // Convert a byte array to a string
        bytesToString: function(bytes) {
          for (var str = [], i = 0; i < bytes.length; i++)
            str.push(String.fromCharCode(bytes[i]));
          return str.join("");
        }
      }
    };
    module.exports = charenc;
  }
});
var require_is_buffer = __commonJS({
  "../node_modules/is-buffer/index.js"(exports, module) {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = function(obj) {
      return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer);
    };
    function isBuffer(obj) {
      return !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
    }
    __name(isBuffer, "isBuffer");
    __name2(isBuffer, "isBuffer");
    function isSlowBuffer(obj) {
      return typeof obj.readFloatLE === "function" && typeof obj.slice === "function" && isBuffer(obj.slice(0, 0));
    }
    __name(isSlowBuffer, "isSlowBuffer");
    __name2(isSlowBuffer, "isSlowBuffer");
  }
});
var require_md5 = __commonJS({
  "../node_modules/md5/md5.js"(exports, module) {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    (function() {
      var crypt = require_crypt(), utf8 = require_charenc().utf8, isBuffer = require_is_buffer(), bin = require_charenc().bin, md5 = /* @__PURE__ */ __name2(function(message, options) {
        if (message.constructor == String)
          if (options && options.encoding === "binary")
            message = bin.stringToBytes(message);
          else
            message = utf8.stringToBytes(message);
        else if (isBuffer(message))
          message = Array.prototype.slice.call(message, 0);
        else if (!Array.isArray(message) && message.constructor !== Uint8Array)
          message = message.toString();
        var m = crypt.bytesToWords(message), l = message.length * 8, a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
        for (var i = 0; i < m.length; i++) {
          m[i] = (m[i] << 8 | m[i] >>> 24) & 16711935 | (m[i] << 24 | m[i] >>> 8) & 4278255360;
        }
        m[l >>> 5] |= 128 << l % 32;
        m[(l + 64 >>> 9 << 4) + 14] = l;
        var FF = md5._ff, GG = md5._gg, HH = md5._hh, II = md5._ii;
        for (var i = 0; i < m.length; i += 16) {
          var aa = a, bb = b, cc = c, dd = d;
          a = FF(a, b, c, d, m[i + 0], 7, -680876936);
          d = FF(d, a, b, c, m[i + 1], 12, -389564586);
          c = FF(c, d, a, b, m[i + 2], 17, 606105819);
          b = FF(b, c, d, a, m[i + 3], 22, -1044525330);
          a = FF(a, b, c, d, m[i + 4], 7, -176418897);
          d = FF(d, a, b, c, m[i + 5], 12, 1200080426);
          c = FF(c, d, a, b, m[i + 6], 17, -1473231341);
          b = FF(b, c, d, a, m[i + 7], 22, -45705983);
          a = FF(a, b, c, d, m[i + 8], 7, 1770035416);
          d = FF(d, a, b, c, m[i + 9], 12, -1958414417);
          c = FF(c, d, a, b, m[i + 10], 17, -42063);
          b = FF(b, c, d, a, m[i + 11], 22, -1990404162);
          a = FF(a, b, c, d, m[i + 12], 7, 1804603682);
          d = FF(d, a, b, c, m[i + 13], 12, -40341101);
          c = FF(c, d, a, b, m[i + 14], 17, -1502002290);
          b = FF(b, c, d, a, m[i + 15], 22, 1236535329);
          a = GG(a, b, c, d, m[i + 1], 5, -165796510);
          d = GG(d, a, b, c, m[i + 6], 9, -1069501632);
          c = GG(c, d, a, b, m[i + 11], 14, 643717713);
          b = GG(b, c, d, a, m[i + 0], 20, -373897302);
          a = GG(a, b, c, d, m[i + 5], 5, -701558691);
          d = GG(d, a, b, c, m[i + 10], 9, 38016083);
          c = GG(c, d, a, b, m[i + 15], 14, -660478335);
          b = GG(b, c, d, a, m[i + 4], 20, -405537848);
          a = GG(a, b, c, d, m[i + 9], 5, 568446438);
          d = GG(d, a, b, c, m[i + 14], 9, -1019803690);
          c = GG(c, d, a, b, m[i + 3], 14, -187363961);
          b = GG(b, c, d, a, m[i + 8], 20, 1163531501);
          a = GG(a, b, c, d, m[i + 13], 5, -1444681467);
          d = GG(d, a, b, c, m[i + 2], 9, -51403784);
          c = GG(c, d, a, b, m[i + 7], 14, 1735328473);
          b = GG(b, c, d, a, m[i + 12], 20, -1926607734);
          a = HH(a, b, c, d, m[i + 5], 4, -378558);
          d = HH(d, a, b, c, m[i + 8], 11, -2022574463);
          c = HH(c, d, a, b, m[i + 11], 16, 1839030562);
          b = HH(b, c, d, a, m[i + 14], 23, -35309556);
          a = HH(a, b, c, d, m[i + 1], 4, -1530992060);
          d = HH(d, a, b, c, m[i + 4], 11, 1272893353);
          c = HH(c, d, a, b, m[i + 7], 16, -155497632);
          b = HH(b, c, d, a, m[i + 10], 23, -1094730640);
          a = HH(a, b, c, d, m[i + 13], 4, 681279174);
          d = HH(d, a, b, c, m[i + 0], 11, -358537222);
          c = HH(c, d, a, b, m[i + 3], 16, -722521979);
          b = HH(b, c, d, a, m[i + 6], 23, 76029189);
          a = HH(a, b, c, d, m[i + 9], 4, -640364487);
          d = HH(d, a, b, c, m[i + 12], 11, -421815835);
          c = HH(c, d, a, b, m[i + 15], 16, 530742520);
          b = HH(b, c, d, a, m[i + 2], 23, -995338651);
          a = II(a, b, c, d, m[i + 0], 6, -198630844);
          d = II(d, a, b, c, m[i + 7], 10, 1126891415);
          c = II(c, d, a, b, m[i + 14], 15, -1416354905);
          b = II(b, c, d, a, m[i + 5], 21, -57434055);
          a = II(a, b, c, d, m[i + 12], 6, 1700485571);
          d = II(d, a, b, c, m[i + 3], 10, -1894986606);
          c = II(c, d, a, b, m[i + 10], 15, -1051523);
          b = II(b, c, d, a, m[i + 1], 21, -2054922799);
          a = II(a, b, c, d, m[i + 8], 6, 1873313359);
          d = II(d, a, b, c, m[i + 15], 10, -30611744);
          c = II(c, d, a, b, m[i + 6], 15, -1560198380);
          b = II(b, c, d, a, m[i + 13], 21, 1309151649);
          a = II(a, b, c, d, m[i + 4], 6, -145523070);
          d = II(d, a, b, c, m[i + 11], 10, -1120210379);
          c = II(c, d, a, b, m[i + 2], 15, 718787259);
          b = II(b, c, d, a, m[i + 9], 21, -343485551);
          a = a + aa >>> 0;
          b = b + bb >>> 0;
          c = c + cc >>> 0;
          d = d + dd >>> 0;
        }
        return crypt.endian([a, b, c, d]);
      }, "md5");
      md5._ff = function(a, b, c, d, x, s, t) {
        var n = a + (b & c | ~b & d) + (x >>> 0) + t;
        return (n << s | n >>> 32 - s) + b;
      };
      md5._gg = function(a, b, c, d, x, s, t) {
        var n = a + (b & d | c & ~d) + (x >>> 0) + t;
        return (n << s | n >>> 32 - s) + b;
      };
      md5._hh = function(a, b, c, d, x, s, t) {
        var n = a + (b ^ c ^ d) + (x >>> 0) + t;
        return (n << s | n >>> 32 - s) + b;
      };
      md5._ii = function(a, b, c, d, x, s, t) {
        var n = a + (c ^ (b | ~d)) + (x >>> 0) + t;
        return (n << s | n >>> 32 - s) + b;
      };
      md5._blocksize = 16;
      md5._digestsize = 16;
      module.exports = function(message, options) {
        if (message === void 0 || message === null)
          throw new Error("Illegal argument " + message);
        var digestbytes = crypt.wordsToBytes(md5(message, options));
        return options && options.asBytes ? digestbytes : options && options.asString ? bin.bytesToString(digestbytes) : crypt.bytesToHex(digestbytes);
      };
    })();
  }
});
var subtle;
var init_web = __esm({
  "../node_modules/unenv/dist/runtime/node/internal/crypto/web.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    subtle = globalThis.crypto?.subtle;
  }
});
var webcrypto;
var createCipher;
var createDecipher;
var pseudoRandomBytes;
var createCipheriv;
var createDecipheriv;
var createECDH;
var createSign;
var createVerify;
var diffieHellman;
var getCipherInfo;
var privateDecrypt;
var privateEncrypt;
var publicDecrypt;
var publicEncrypt;
var sign;
var verify;
var hash;
var Cipher;
var Cipheriv;
var Decipher;
var Decipheriv;
var ECDH;
var Sign;
var Verify;
var init_node = __esm({
  "../node_modules/unenv/dist/runtime/node/internal/crypto/node.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    webcrypto = new Proxy(globalThis.crypto, { get(_, key) {
      if (key === "CryptoKey") {
        return globalThis.CryptoKey;
      }
      if (typeof globalThis.crypto[key] === "function") {
        return globalThis.crypto[key].bind(globalThis.crypto);
      }
      return globalThis.crypto[key];
    } });
    createCipher = /* @__PURE__ */ notImplemented2("crypto.createCipher");
    createDecipher = /* @__PURE__ */ notImplemented2("crypto.createDecipher");
    pseudoRandomBytes = /* @__PURE__ */ notImplemented2("crypto.pseudoRandomBytes");
    createCipheriv = /* @__PURE__ */ notImplemented2("crypto.createCipheriv");
    createDecipheriv = /* @__PURE__ */ notImplemented2("crypto.createDecipheriv");
    createECDH = /* @__PURE__ */ notImplemented2("crypto.createECDH");
    createSign = /* @__PURE__ */ notImplemented2("crypto.createSign");
    createVerify = /* @__PURE__ */ notImplemented2("crypto.createVerify");
    diffieHellman = /* @__PURE__ */ notImplemented2("crypto.diffieHellman");
    getCipherInfo = /* @__PURE__ */ notImplemented2("crypto.getCipherInfo");
    privateDecrypt = /* @__PURE__ */ notImplemented2("crypto.privateDecrypt");
    privateEncrypt = /* @__PURE__ */ notImplemented2("crypto.privateEncrypt");
    publicDecrypt = /* @__PURE__ */ notImplemented2("crypto.publicDecrypt");
    publicEncrypt = /* @__PURE__ */ notImplemented2("crypto.publicEncrypt");
    sign = /* @__PURE__ */ notImplemented2("crypto.sign");
    verify = /* @__PURE__ */ notImplemented2("crypto.verify");
    hash = /* @__PURE__ */ notImplemented2("crypto.hash");
    Cipher = /* @__PURE__ */ notImplementedClass2("crypto.Cipher");
    Cipheriv = /* @__PURE__ */ notImplementedClass2(
      "crypto.Cipheriv"
      // @ts-expect-error not typed yet
    );
    Decipher = /* @__PURE__ */ notImplementedClass2("crypto.Decipher");
    Decipheriv = /* @__PURE__ */ notImplementedClass2(
      "crypto.Decipheriv"
      // @ts-expect-error not typed yet
    );
    ECDH = /* @__PURE__ */ notImplementedClass2("crypto.ECDH");
    Sign = /* @__PURE__ */ notImplementedClass2("crypto.Sign");
    Verify = /* @__PURE__ */ notImplementedClass2("crypto.Verify");
  }
});
var SSL_OP_ALL;
var SSL_OP_ALLOW_NO_DHE_KEX;
var SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION;
var SSL_OP_CIPHER_SERVER_PREFERENCE;
var SSL_OP_CISCO_ANYCONNECT;
var SSL_OP_COOKIE_EXCHANGE;
var SSL_OP_CRYPTOPRO_TLSEXT_BUG;
var SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS;
var SSL_OP_LEGACY_SERVER_CONNECT;
var SSL_OP_NO_COMPRESSION;
var SSL_OP_NO_ENCRYPT_THEN_MAC;
var SSL_OP_NO_QUERY_MTU;
var SSL_OP_NO_RENEGOTIATION;
var SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION;
var SSL_OP_NO_SSLv2;
var SSL_OP_NO_SSLv3;
var SSL_OP_NO_TICKET;
var SSL_OP_NO_TLSv1;
var SSL_OP_NO_TLSv1_1;
var SSL_OP_NO_TLSv1_2;
var SSL_OP_NO_TLSv1_3;
var SSL_OP_PRIORITIZE_CHACHA;
var SSL_OP_TLS_ROLLBACK_BUG;
var ENGINE_METHOD_RSA;
var ENGINE_METHOD_DSA;
var ENGINE_METHOD_DH;
var ENGINE_METHOD_RAND;
var ENGINE_METHOD_EC;
var ENGINE_METHOD_CIPHERS;
var ENGINE_METHOD_DIGESTS;
var ENGINE_METHOD_PKEY_METHS;
var ENGINE_METHOD_PKEY_ASN1_METHS;
var ENGINE_METHOD_ALL;
var ENGINE_METHOD_NONE;
var DH_CHECK_P_NOT_SAFE_PRIME;
var DH_CHECK_P_NOT_PRIME;
var DH_UNABLE_TO_CHECK_GENERATOR;
var DH_NOT_SUITABLE_GENERATOR;
var RSA_PKCS1_PADDING;
var RSA_NO_PADDING;
var RSA_PKCS1_OAEP_PADDING;
var RSA_X931_PADDING;
var RSA_PKCS1_PSS_PADDING;
var RSA_PSS_SALTLEN_DIGEST;
var RSA_PSS_SALTLEN_MAX_SIGN;
var RSA_PSS_SALTLEN_AUTO;
var POINT_CONVERSION_COMPRESSED;
var POINT_CONVERSION_UNCOMPRESSED;
var POINT_CONVERSION_HYBRID;
var defaultCoreCipherList;
var defaultCipherList;
var OPENSSL_VERSION_NUMBER;
var TLS1_VERSION;
var TLS1_1_VERSION;
var TLS1_2_VERSION;
var TLS1_3_VERSION;
var init_constants = __esm({
  "../node_modules/unenv/dist/runtime/node/internal/crypto/constants.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    SSL_OP_ALL = 2147485776;
    SSL_OP_ALLOW_NO_DHE_KEX = 1024;
    SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION = 262144;
    SSL_OP_CIPHER_SERVER_PREFERENCE = 4194304;
    SSL_OP_CISCO_ANYCONNECT = 32768;
    SSL_OP_COOKIE_EXCHANGE = 8192;
    SSL_OP_CRYPTOPRO_TLSEXT_BUG = 2147483648;
    SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS = 2048;
    SSL_OP_LEGACY_SERVER_CONNECT = 4;
    SSL_OP_NO_COMPRESSION = 131072;
    SSL_OP_NO_ENCRYPT_THEN_MAC = 524288;
    SSL_OP_NO_QUERY_MTU = 4096;
    SSL_OP_NO_RENEGOTIATION = 1073741824;
    SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION = 65536;
    SSL_OP_NO_SSLv2 = 0;
    SSL_OP_NO_SSLv3 = 33554432;
    SSL_OP_NO_TICKET = 16384;
    SSL_OP_NO_TLSv1 = 67108864;
    SSL_OP_NO_TLSv1_1 = 268435456;
    SSL_OP_NO_TLSv1_2 = 134217728;
    SSL_OP_NO_TLSv1_3 = 536870912;
    SSL_OP_PRIORITIZE_CHACHA = 2097152;
    SSL_OP_TLS_ROLLBACK_BUG = 8388608;
    ENGINE_METHOD_RSA = 1;
    ENGINE_METHOD_DSA = 2;
    ENGINE_METHOD_DH = 4;
    ENGINE_METHOD_RAND = 8;
    ENGINE_METHOD_EC = 2048;
    ENGINE_METHOD_CIPHERS = 64;
    ENGINE_METHOD_DIGESTS = 128;
    ENGINE_METHOD_PKEY_METHS = 512;
    ENGINE_METHOD_PKEY_ASN1_METHS = 1024;
    ENGINE_METHOD_ALL = 65535;
    ENGINE_METHOD_NONE = 0;
    DH_CHECK_P_NOT_SAFE_PRIME = 2;
    DH_CHECK_P_NOT_PRIME = 1;
    DH_UNABLE_TO_CHECK_GENERATOR = 4;
    DH_NOT_SUITABLE_GENERATOR = 8;
    RSA_PKCS1_PADDING = 1;
    RSA_NO_PADDING = 3;
    RSA_PKCS1_OAEP_PADDING = 4;
    RSA_X931_PADDING = 5;
    RSA_PKCS1_PSS_PADDING = 6;
    RSA_PSS_SALTLEN_DIGEST = -1;
    RSA_PSS_SALTLEN_MAX_SIGN = -2;
    RSA_PSS_SALTLEN_AUTO = -2;
    POINT_CONVERSION_COMPRESSED = 2;
    POINT_CONVERSION_UNCOMPRESSED = 4;
    POINT_CONVERSION_HYBRID = 6;
    defaultCoreCipherList = "";
    defaultCipherList = "";
    OPENSSL_VERSION_NUMBER = 0;
    TLS1_VERSION = 0;
    TLS1_1_VERSION = 0;
    TLS1_2_VERSION = 0;
    TLS1_3_VERSION = 0;
  }
});
var constants;
var init_crypto = __esm({
  "../node_modules/unenv/dist/runtime/node/crypto.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_constants();
    init_web();
    init_node();
    constants = {
      OPENSSL_VERSION_NUMBER,
      SSL_OP_ALL,
      SSL_OP_ALLOW_NO_DHE_KEX,
      SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION,
      SSL_OP_CIPHER_SERVER_PREFERENCE,
      SSL_OP_CISCO_ANYCONNECT,
      SSL_OP_COOKIE_EXCHANGE,
      SSL_OP_CRYPTOPRO_TLSEXT_BUG,
      SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS,
      SSL_OP_LEGACY_SERVER_CONNECT,
      SSL_OP_NO_COMPRESSION,
      SSL_OP_NO_ENCRYPT_THEN_MAC,
      SSL_OP_NO_QUERY_MTU,
      SSL_OP_NO_RENEGOTIATION,
      SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION,
      SSL_OP_NO_SSLv2,
      SSL_OP_NO_SSLv3,
      SSL_OP_NO_TICKET,
      SSL_OP_NO_TLSv1,
      SSL_OP_NO_TLSv1_1,
      SSL_OP_NO_TLSv1_2,
      SSL_OP_NO_TLSv1_3,
      SSL_OP_PRIORITIZE_CHACHA,
      SSL_OP_TLS_ROLLBACK_BUG,
      ENGINE_METHOD_RSA,
      ENGINE_METHOD_DSA,
      ENGINE_METHOD_DH,
      ENGINE_METHOD_RAND,
      ENGINE_METHOD_EC,
      ENGINE_METHOD_CIPHERS,
      ENGINE_METHOD_DIGESTS,
      ENGINE_METHOD_PKEY_METHS,
      ENGINE_METHOD_PKEY_ASN1_METHS,
      ENGINE_METHOD_ALL,
      ENGINE_METHOD_NONE,
      DH_CHECK_P_NOT_SAFE_PRIME,
      DH_CHECK_P_NOT_PRIME,
      DH_UNABLE_TO_CHECK_GENERATOR,
      DH_NOT_SUITABLE_GENERATOR,
      RSA_PKCS1_PADDING,
      RSA_NO_PADDING,
      RSA_PKCS1_OAEP_PADDING,
      RSA_X931_PADDING,
      RSA_PKCS1_PSS_PADDING,
      RSA_PSS_SALTLEN_DIGEST,
      RSA_PSS_SALTLEN_MAX_SIGN,
      RSA_PSS_SALTLEN_AUTO,
      defaultCoreCipherList,
      TLS1_VERSION,
      TLS1_1_VERSION,
      TLS1_2_VERSION,
      TLS1_3_VERSION,
      POINT_CONVERSION_COMPRESSED,
      POINT_CONVERSION_UNCOMPRESSED,
      POINT_CONVERSION_HYBRID,
      defaultCipherList
    };
  }
});
var workerdCrypto;
var Certificate;
var DiffieHellman;
var DiffieHellmanGroup;
var Hash;
var Hmac;
var KeyObject;
var X509Certificate;
var checkPrime;
var checkPrimeSync;
var createDiffieHellman;
var createDiffieHellmanGroup;
var createHash;
var createHmac;
var createPrivateKey;
var createPublicKey;
var createSecretKey;
var generateKey;
var generateKeyPair;
var generateKeyPairSync;
var generateKeySync;
var generatePrime;
var generatePrimeSync;
var getCiphers;
var getCurves;
var getDiffieHellman;
var getFips;
var getHashes;
var hkdf;
var hkdfSync;
var pbkdf2;
var pbkdf2Sync;
var randomBytes;
var randomFill;
var randomFillSync;
var randomInt;
var randomUUID;
var scrypt;
var scryptSync;
var secureHeapUsed;
var setEngine;
var setFips;
var subtle2;
var timingSafeEqual;
var getRandomValues;
var webcrypto2;
var fips;
var crypto_default;
var init_crypto2 = __esm({
  "../node_modules/@cloudflare/unenv-preset/dist/runtime/node/crypto.mjs"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_crypto();
    workerdCrypto = process.getBuiltinModule("node:crypto");
    ({
      Certificate,
      DiffieHellman,
      DiffieHellmanGroup,
      Hash,
      Hmac,
      KeyObject,
      X509Certificate,
      checkPrime,
      checkPrimeSync,
      createDiffieHellman,
      createDiffieHellmanGroup,
      createHash,
      createHmac,
      createPrivateKey,
      createPublicKey,
      createSecretKey,
      generateKey,
      generateKeyPair,
      generateKeyPairSync,
      generateKeySync,
      generatePrime,
      generatePrimeSync,
      getCiphers,
      getCurves,
      getDiffieHellman,
      getFips,
      getHashes,
      hkdf,
      hkdfSync,
      pbkdf2,
      pbkdf2Sync,
      randomBytes,
      randomFill,
      randomFillSync,
      randomInt,
      randomUUID,
      scrypt,
      scryptSync,
      secureHeapUsed,
      setEngine,
      setFips,
      subtle: subtle2,
      timingSafeEqual
    } = workerdCrypto);
    getRandomValues = workerdCrypto.getRandomValues.bind(
      workerdCrypto.webcrypto
    );
    webcrypto2 = {
      // @ts-expect-error unenv has unknown type
      CryptoKey: webcrypto.CryptoKey,
      getRandomValues,
      randomUUID,
      subtle: subtle2
    };
    fips = workerdCrypto.fips;
    crypto_default = {
      /**
       * manually unroll unenv-polyfilled-symbols to make it tree-shakeable
       */
      Certificate,
      Cipher,
      Cipheriv,
      Decipher,
      Decipheriv,
      ECDH,
      Sign,
      Verify,
      X509Certificate,
      // @ts-expect-error @types/node is out of date - this is a bug in typings
      constants,
      // @ts-expect-error unenv has unknown type
      createCipheriv,
      // @ts-expect-error unenv has unknown type
      createDecipheriv,
      // @ts-expect-error unenv has unknown type
      createECDH,
      // @ts-expect-error unenv has unknown type
      createSign,
      // @ts-expect-error unenv has unknown type
      createVerify,
      // @ts-expect-error unenv has unknown type
      diffieHellman,
      // @ts-expect-error unenv has unknown type
      getCipherInfo,
      // @ts-expect-error unenv has unknown type
      hash,
      // @ts-expect-error unenv has unknown type
      privateDecrypt,
      // @ts-expect-error unenv has unknown type
      privateEncrypt,
      // @ts-expect-error unenv has unknown type
      publicDecrypt,
      // @ts-expect-error unenv has unknown type
      publicEncrypt,
      scrypt,
      scryptSync,
      // @ts-expect-error unenv has unknown type
      sign,
      // @ts-expect-error unenv has unknown type
      verify,
      // default-only export from unenv
      // @ts-expect-error unenv has unknown type
      createCipher,
      // @ts-expect-error unenv has unknown type
      createDecipher,
      // @ts-expect-error unenv has unknown type
      pseudoRandomBytes,
      /**
       * manually unroll workerd-polyfilled-symbols to make it tree-shakeable
       */
      DiffieHellman,
      DiffieHellmanGroup,
      Hash,
      Hmac,
      KeyObject,
      checkPrime,
      checkPrimeSync,
      createDiffieHellman,
      createDiffieHellmanGroup,
      createHash,
      createHmac,
      createPrivateKey,
      createPublicKey,
      createSecretKey,
      generateKey,
      generateKeyPair,
      generateKeyPairSync,
      generateKeySync,
      generatePrime,
      generatePrimeSync,
      getCiphers,
      getCurves,
      getDiffieHellman,
      getFips,
      getHashes,
      getRandomValues,
      hkdf,
      hkdfSync,
      pbkdf2,
      pbkdf2Sync,
      randomBytes,
      randomFill,
      randomFillSync,
      randomInt,
      randomUUID,
      secureHeapUsed,
      setEngine,
      setFips,
      subtle: subtle2,
      timingSafeEqual,
      // default-only export from workerd
      fips,
      // special-cased deep merged symbols
      webcrypto: webcrypto2
    };
  }
});
var require_crypto = __commonJS({
  "node-built-in-modules:crypto"(exports, module) {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_crypto2();
    module.exports = crypto_default;
  }
});
var require_zlib = __commonJS({
  "node-built-in-modules:zlib"(exports, module) {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault;
  }
});
var require_AccessToken2 = __commonJS({
  "../node_modules/agora-token/src/AccessToken2.js"(exports, module) {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var crypto = require_crypto();
    var zlib = require_zlib();
    var VERSION_LENGTH = 3;
    var APP_ID_LENGTH = 32;
    var getVersion = /* @__PURE__ */ __name2(() => {
      return "007";
    }, "getVersion");
    var Service = /* @__PURE__ */ __name(class {
      constructor(service_type) {
        this.__type = service_type;
        this.__privileges = {};
      }
      __pack_type() {
        let buf = new ByteBuf();
        buf.putUint16(this.__type);
        return buf.pack();
      }
      __pack_privileges() {
        let buf = new ByteBuf();
        buf.putTreeMapUInt32(this.__privileges);
        return buf.pack();
      }
      service_type() {
        return this.__type;
      }
      add_privilege(privilege, expire) {
        this.__privileges[privilege] = expire;
      }
      pack() {
        return Buffer.concat([this.__pack_type(), this.__pack_privileges()]);
      }
      unpack(buffer) {
        let bufReader = new ReadByteBuf(buffer);
        this.__privileges = bufReader.getTreeMapUInt32();
        return bufReader;
      }
    }, "Service");
    __name2(Service, "Service");
    var kRtcServiceType = 1;
    var ServiceRtc = /* @__PURE__ */ __name(class extends Service {
      constructor(channel_name, uid) {
        super(kRtcServiceType);
        this.__channel_name = channel_name;
        this.__uid = uid === 0 ? "" : `${uid}`;
      }
      pack() {
        let buffer = new ByteBuf();
        buffer.putString(this.__channel_name).putString(this.__uid);
        return Buffer.concat([super.pack(), buffer.pack()]);
      }
      unpack(buffer) {
        let bufReader = super.unpack(buffer);
        this.__channel_name = bufReader.getString();
        this.__uid = bufReader.getString();
        return bufReader;
      }
    }, "ServiceRtc");
    __name2(ServiceRtc, "ServiceRtc");
    ServiceRtc.kPrivilegeJoinChannel = 1;
    ServiceRtc.kPrivilegePublishAudioStream = 2;
    ServiceRtc.kPrivilegePublishVideoStream = 3;
    ServiceRtc.kPrivilegePublishDataStream = 4;
    var kRtmServiceType = 2;
    var ServiceRtm = /* @__PURE__ */ __name(class extends Service {
      constructor(user_id) {
        super(kRtmServiceType);
        this.__user_id = user_id || "";
      }
      pack() {
        let buffer = new ByteBuf();
        buffer.putString(this.__user_id);
        return Buffer.concat([super.pack(), buffer.pack()]);
      }
      unpack(buffer) {
        let bufReader = super.unpack(buffer);
        this.__user_id = bufReader.getString();
        return bufReader;
      }
    }, "ServiceRtm");
    __name2(ServiceRtm, "ServiceRtm");
    ServiceRtm.kPrivilegeLogin = 1;
    var kFpaServiceType = 4;
    var ServiceFpa = /* @__PURE__ */ __name(class extends Service {
      constructor() {
        super(kFpaServiceType);
      }
      pack() {
        return super.pack();
      }
      unpack(buffer) {
        let bufReader = super.unpack(buffer);
        return bufReader;
      }
    }, "ServiceFpa");
    __name2(ServiceFpa, "ServiceFpa");
    ServiceFpa.kPrivilegeLogin = 1;
    var kChatServiceType = 5;
    var ServiceChat = /* @__PURE__ */ __name(class extends Service {
      constructor(user_id) {
        super(kChatServiceType);
        this.__user_id = user_id || "";
      }
      pack() {
        let buffer = new ByteBuf();
        buffer.putString(this.__user_id);
        return Buffer.concat([super.pack(), buffer.pack()]);
      }
      unpack(buffer) {
        let bufReader = super.unpack(buffer);
        this.__user_id = bufReader.getString();
        return bufReader;
      }
    }, "ServiceChat");
    __name2(ServiceChat, "ServiceChat");
    ServiceChat.kPrivilegeUser = 1;
    ServiceChat.kPrivilegeApp = 2;
    var kApaasServiceType = 7;
    var ServiceApaas = /* @__PURE__ */ __name(class extends Service {
      constructor(roomUuid, userUuid, role) {
        super(kApaasServiceType);
        this.__room_uuid = roomUuid || "";
        this.__user_uuid = userUuid || "";
        this.__role = role || -1;
      }
      pack() {
        let buffer = new ByteBuf();
        buffer.putString(this.__room_uuid);
        buffer.putString(this.__user_uuid);
        buffer.putInt16(this.__role);
        return Buffer.concat([super.pack(), buffer.pack()]);
      }
      unpack(buffer) {
        let bufReader = super.unpack(buffer);
        this.__room_uuid = bufReader.getString();
        this.__user_uuid = bufReader.getString();
        this.__role = bufReader.getInt16();
        return bufReader;
      }
    }, "ServiceApaas");
    __name2(ServiceApaas, "ServiceApaas");
    ServiceApaas.PRIVILEGE_ROOM_USER = 1;
    ServiceApaas.PRIVILEGE_USER = 2;
    ServiceApaas.PRIVILEGE_APP = 3;
    var AccessToken2 = /* @__PURE__ */ __name(class {
      constructor(appId, appCertificate, issueTs, expire) {
        this.appId = appId;
        this.appCertificate = appCertificate;
        this.issueTs = issueTs || (/* @__PURE__ */ new Date()).getTime() / 1e3;
        this.expire = expire;
        this.salt = Math.floor(Math.random() * 99999999) + 1;
        this.services = {};
      }
      __signing() {
        let signing = encodeHMac(new ByteBuf().putUint32(this.issueTs).pack(), this.appCertificate);
        signing = encodeHMac(new ByteBuf().putUint32(this.salt).pack(), signing);
        return signing;
      }
      __build_check() {
        let is_uuid = /* @__PURE__ */ __name2((data) => {
          if (data.length !== APP_ID_LENGTH) {
            return false;
          }
          let buf = Buffer.from(data, "hex");
          return !!buf;
        }, "is_uuid");
        const { appId, appCertificate, services } = this;
        if (!is_uuid(appId) || !is_uuid(appCertificate)) {
          return false;
        }
        if (Object.keys(services).length === 0) {
          return false;
        }
        return true;
      }
      add_service(service) {
        this.services[service.service_type()] = service;
      }
      build() {
        if (!this.__build_check()) {
          return "";
        }
        let signing = this.__signing();
        let signing_info = new ByteBuf().putString(this.appId).putUint32(this.issueTs).putUint32(this.expire).putUint32(this.salt).putUint16(Object.keys(this.services).length).pack();
        Object.values(this.services).forEach((service) => {
          signing_info = Buffer.concat([signing_info, service.pack()]);
        });
        let signature = encodeHMac(signing, signing_info);
        let content = Buffer.concat([new ByteBuf().putString(signature).pack(), signing_info]);
        let compressed = zlib.deflateSync(content);
        return `${getVersion()}${Buffer.from(compressed).toString("base64")}`;
      }
      from_string(origin_token) {
        let origin_version = origin_token.substring(0, VERSION_LENGTH);
        if (origin_version !== getVersion()) {
          return false;
        }
        let origin_content = origin_token.substring(VERSION_LENGTH, origin_token.length);
        let buffer = zlib.inflateSync(new Buffer(origin_content, "base64"));
        let bufferReader = new ReadByteBuf(buffer);
        let signature = bufferReader.getString();
        this.appId = bufferReader.getString();
        this.issueTs = bufferReader.getUint32();
        this.expire = bufferReader.getUint32();
        this.salt = bufferReader.getUint32();
        let service_count = bufferReader.getUint16();
        let remainBuf = bufferReader.pack();
        for (let i = 0; i < service_count; i++) {
          let bufferReaderService = new ReadByteBuf(remainBuf);
          let service_type = bufferReaderService.getUint16();
          let service = new AccessToken2.kServices[service_type]();
          remainBuf = service.unpack(bufferReaderService.pack()).pack();
          this.services[service_type] = service;
        }
      }
    }, "AccessToken2");
    __name2(AccessToken2, "AccessToken2");
    var encodeHMac = /* @__PURE__ */ __name2(function(key, message) {
      return crypto.createHmac("sha256", key).update(message).digest();
    }, "encodeHMac");
    var ByteBuf = /* @__PURE__ */ __name2(function() {
      var that = {
        buffer: Buffer.alloc(1024),
        position: 0
      };
      that.buffer.fill(0);
      that.pack = function() {
        var out = Buffer.alloc(that.position);
        that.buffer.copy(out, 0, 0, out.length);
        return out;
      };
      that.putUint16 = function(v) {
        that.buffer.writeUInt16LE(v, that.position);
        that.position += 2;
        return that;
      };
      that.putUint32 = function(v) {
        that.buffer.writeUInt32LE(v, that.position);
        that.position += 4;
        return that;
      };
      that.putInt32 = function(v) {
        that.buffer.writeInt32LE(v, that.position);
        that.position += 4;
        return that;
      };
      that.putInt16 = function(v) {
        that.buffer.writeInt16LE(v, that.position);
        that.position += 2;
        return that;
      };
      that.putBytes = function(bytes) {
        that.putUint16(bytes.length);
        bytes.copy(that.buffer, that.position);
        that.position += bytes.length;
        return that;
      };
      that.putString = function(str) {
        return that.putBytes(Buffer.from(str));
      };
      that.putTreeMap = function(map) {
        if (!map) {
          that.putUint16(0);
          return that;
        }
        that.putUint16(Object.keys(map).length);
        for (var key in map) {
          that.putUint16(key);
          that.putString(map[key]);
        }
        return that;
      };
      that.putTreeMapUInt32 = function(map) {
        if (!map) {
          that.putUint16(0);
          return that;
        }
        that.putUint16(Object.keys(map).length);
        for (var key in map) {
          that.putUint16(key);
          that.putUint32(map[key]);
        }
        return that;
      };
      return that;
    }, "ByteBuf");
    var ReadByteBuf = /* @__PURE__ */ __name2(function(bytes) {
      var that = {
        buffer: bytes,
        position: 0
      };
      that.getUint16 = function() {
        var ret = that.buffer.readUInt16LE(that.position);
        that.position += 2;
        return ret;
      };
      that.getUint32 = function() {
        var ret = that.buffer.readUInt32LE(that.position);
        that.position += 4;
        return ret;
      };
      that.getInt16 = function() {
        var ret = that.buffer.readUInt16LE(that.position);
        that.position += 2;
        return ret;
      };
      that.getString = function() {
        var len = that.getUint16();
        var out = Buffer.alloc(len);
        that.buffer.copy(out, 0, that.position, that.position + len);
        that.position += len;
        return out;
      };
      that.getTreeMapUInt32 = function() {
        var map = {};
        var len = that.getUint16();
        for (var i = 0; i < len; i++) {
          var key = that.getUint16();
          var value = that.getUint32();
          map[key] = value;
        }
        return map;
      };
      that.pack = function() {
        let length = that.buffer.length;
        var out = Buffer.alloc(length);
        that.buffer.copy(out, 0, that.position, length);
        return out;
      };
      return that;
    }, "ReadByteBuf");
    AccessToken2.kServices = {};
    AccessToken2.kServices[kApaasServiceType] = ServiceApaas;
    AccessToken2.kServices[kChatServiceType] = ServiceChat;
    AccessToken2.kServices[kFpaServiceType] = ServiceFpa;
    AccessToken2.kServices[kRtcServiceType] = ServiceRtc;
    AccessToken2.kServices[kRtmServiceType] = ServiceRtm;
    module.exports = {
      AccessToken2,
      kApaasServiceType,
      kChatServiceType,
      kFpaServiceType,
      kRtcServiceType,
      kRtmServiceType,
      ServiceApaas,
      ServiceChat,
      ServiceFpa,
      ServiceRtc,
      ServiceRtm
    };
  }
});
var require_ApaasTokenBuilder = __commonJS({
  "../node_modules/agora-token/src/ApaasTokenBuilder.js"(exports, module) {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var md5 = require_md5();
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceApaas = require_AccessToken2().ServiceApaas;
    var ServiceChat = require_AccessToken2().ServiceChat;
    var ServiceRtm = require_AccessToken2().ServiceRtm;
    var ApaasTokenBuilder = /* @__PURE__ */ __name(class {
      /**
       * build user room token
       * @param appId             The App ID issued to you by Agora. Apply for a new App ID from
       *                          Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate    Certificate of the application that you registered in
       *                          the Agora Dashboard. See Get an App Certificate.
       * @param roomUuid          The room's id, must be unique.
       * @param userUuid          The user's id, must be unique.
       * @param role              The user's role.
       * @param expire            represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                          Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The user room token.
       */
      static buildRoomUserToken(appId, appCertificate, roomUuid, userUuid, role, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let chatUserId = md5(userUuid);
        let apaasService = new ServiceApaas(roomUuid, userUuid, role);
        accessToken.add_service(apaasService);
        let rtmService = new ServiceRtm(userUuid);
        rtmService.add_privilege(ServiceRtm.kPrivilegeLogin, expire);
        accessToken.add_service(rtmService);
        let chatService = new ServiceChat(chatUserId);
        chatService.add_privilege(ServiceChat.kPrivilegeUser, expire);
        accessToken.add_service(chatService);
        return accessToken.build();
      }
      /**
       * build user token
       * @param appId             The App ID issued to you by Agora. Apply for a new App ID from
       *                          Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate    Certificate of the application that you registered in
       *                          the Agora Dashboard. See Get an App Certificate.
       * @param userUuid          The user's id, must be unique.
       * @param expire            represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                          Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The user token.
       */
      static buildUserToken(appId, appCertificate, userUuid, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let apaasService = new ServiceApaas("", userUuid);
        apaasService.add_privilege(ServiceApaas.PRIVILEGE_USER, expire);
        accessToken.add_service(apaasService);
        return accessToken.build();
      }
      /**
       * build app token
       * @param appId          The App ID issued to you by Agora. Apply for a new App ID from
       *                       Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       *                       the Agora Dashboard. See Get an App Certificate.
       * @param expire         represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                       Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The app token.
       */
      static buildAppToken(appId, appCertificate, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let apaasService = new ServiceApaas();
        apaasService.add_privilege(ServiceApaas.PRIVILEGE_APP, expire);
        accessToken.add_service(apaasService);
        return accessToken.build();
      }
    }, "ApaasTokenBuilder");
    __name2(ApaasTokenBuilder, "ApaasTokenBuilder");
    module.exports.ApaasTokenBuilder = ApaasTokenBuilder;
  }
});
var require_ChatTokenBuilder = __commonJS({
  "../node_modules/agora-token/src/ChatTokenBuilder.js"(exports) {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceChat = require_AccessToken2().ServiceChat;
    var ChatTokenBuilder = /* @__PURE__ */ __name(class {
      /**
       * Build the Chat user token.
       *
       * @param appId The App ID issued to you by Agora. Apply for a new App ID from
       * Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       * the Agora Dashboard. See Get an App Certificate.
       * @param userUuid The user's id, must be unique.
       * @param expire represented by the number of seconds elapsed since now. If, for example, you want to access the
       * Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The Chat User token.
       */
      static buildUserToken(appId, appCertificate, userUuid, expire) {
        const token = new AccessToken(appId, appCertificate, null, expire);
        const serviceChat = new ServiceChat(userUuid);
        serviceChat.add_privilege(ServiceChat.kPrivilegeUser, expire);
        token.add_service(serviceChat);
        return token.build();
      }
      /**
       * Build the Chat App token.
       *
       * @param appId The App ID issued to you by Agora. Apply for a new App ID from
       * Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       * the Agora Dashboard. See Get an App Certificate.
       * @param expire represented by the number of seconds elapsed since now. If, for example, you want to access the
       * Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The Chat App token.
       */
      static buildAppToken(appId, appCertificate, expire) {
        const token = new AccessToken(appId, appCertificate, null, expire);
        const serviceChat = new ServiceChat();
        serviceChat.add_privilege(ServiceChat.kPrivilegeApp, expire);
        token.add_service(serviceChat);
        return token.build();
      }
    }, "ChatTokenBuilder");
    __name2(ChatTokenBuilder, "ChatTokenBuilder");
    exports.ChatTokenBuilder = ChatTokenBuilder;
  }
});
var require_EducationTokenBuilder = __commonJS({
  "../node_modules/agora-token/src/EducationTokenBuilder.js"(exports, module) {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var md5 = require_md5();
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceApaas = require_AccessToken2().ServiceApaas;
    var ServiceChat = require_AccessToken2().ServiceChat;
    var ServiceRtm = require_AccessToken2().ServiceRtm;
    var EducationTokenBuilder = /* @__PURE__ */ __name(class {
      /**
       * build user room token
       * @param appId             The App ID issued to you by Agora. Apply for a new App ID from
       *                          Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate    Certificate of the application that you registered in
       *                          the Agora Dashboard. See Get an App Certificate.
       * @param roomUuid          The room's id, must be unique.
       * @param userUuid          The user's id, must be unique.
       * @param role              The user's role.
       * @param expire            represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                          Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The user room token.
       */
      static buildRoomUserToken(appId, appCertificate, roomUuid, userUuid, role, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let chatUserId = md5(userUuid);
        let apaasService = new ServiceApaas(roomUuid, userUuid, role);
        accessToken.add_service(apaasService);
        let rtmService = new ServiceRtm(userUuid);
        rtmService.add_privilege(ServiceRtm.kPrivilegeLogin, expire);
        accessToken.add_service(rtmService);
        let chatService = new ServiceChat(chatUserId);
        chatService.add_privilege(ServiceChat.kPrivilegeUser, expire);
        accessToken.add_service(chatService);
        return accessToken.build();
      }
      /**
       * build user token
       * @param appId             The App ID issued to you by Agora. Apply for a new App ID from
       *                          Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate    Certificate of the application that you registered in
       *                          the Agora Dashboard. See Get an App Certificate.
       * @param userUuid          The user's id, must be unique.
       * @param expire            represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                          Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The user token.
       */
      static buildUserToken(appId, appCertificate, userUuid, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let apaasService = new ServiceApaas("", userUuid);
        apaasService.add_privilege(ServiceApaas.PRIVILEGE_USER, expire);
        accessToken.add_service(apaasService);
        return accessToken.build();
      }
      /**
       * build app token
       * @param appId          The App ID issued to you by Agora. Apply for a new App ID from
       *                       Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       *                       the Agora Dashboard. See Get an App Certificate.
       * @param expire         represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                       Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The app token.
       */
      static buildAppToken(appId, appCertificate, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let apaasService = new ServiceApaas();
        apaasService.add_privilege(ServiceApaas.PRIVILEGE_APP, expire);
        accessToken.add_service(apaasService);
        return accessToken.build();
      }
    }, "EducationTokenBuilder");
    __name2(EducationTokenBuilder, "EducationTokenBuilder");
    module.exports.EducationTokenBuilder = EducationTokenBuilder;
  }
});
var require_FpaTokenBuilder = __commonJS({
  "../node_modules/agora-token/src/FpaTokenBuilder.js"(exports, module) {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceFpa = require_AccessToken2().ServiceFpa;
    var FpaTokenBuilder = /* @__PURE__ */ __name(class {
      /**
       * Build the FPA token.
       * @param appId The App ID issued to you by Agora. Apply for a new App ID from
       * Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       * the Agora Dashboard. See Get an App Certificate.
       * @return The FPA token.
       */
      static buildToken(appId, appCertificate) {
        let token = new AccessToken(appId, appCertificate, 0, 24 * 3600);
        let serviceFpa = new ServiceFpa();
        serviceFpa.add_privilege(ServiceFpa.kPrivilegeLogin, 0);
        token.add_service(serviceFpa);
        return token.build();
      }
    }, "FpaTokenBuilder");
    __name2(FpaTokenBuilder, "FpaTokenBuilder");
    module.exports.FpaTokenBuilder = FpaTokenBuilder;
  }
});
var require_RtcTokenBuilder2 = __commonJS({
  "../node_modules/agora-token/src/RtcTokenBuilder2.js"(exports, module) {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceRtc = require_AccessToken2().ServiceRtc;
    var ServiceRtm = require_AccessToken2().ServiceRtm;
    var Role = {
      /**
       * RECOMMENDED. Use this role for a voice/video call or a live broadcast, if
       * your scenario does not require authentication for
       * [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication).
       */
      PUBLISHER: 1,
      /**
       * Only use this role if your scenario require authentication for
       * [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication).
       *
       * @note In order for this role to take effect, please contact our support team
       * to enable authentication for Hosting-in for you. Otherwise, Role_Subscriber
       * still has the same privileges as Role_Publisher.
       */
      SUBSCRIBER: 2
    };
    var RtcTokenBuilder2 = /* @__PURE__ */ __name(class {
      /**
       * Builds an RTC token using an Integer uid.
       * @param {*} appId  The App ID issued to you by Agora.
       * @param {*} appCertificate Certificate of the application that you registered in the Agora Dashboard.
       * @param {*} channelName The unique channel name for the AgoraRTC session in the string format. The string length must be less than 64 bytes. Supported character scopes are:
       * - The 26 lowercase English letters: a to z.
       * - The 26 uppercase English letters: A to Z.
       * - The 10 digits: 0 to 9.
       * - The space.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param {*} uid User ID. A 32-bit unsigned integer with a value ranging from 1 to (2^32-1).
       * @param {*} role See #userRole.
       * - Role.PUBLISHER; RECOMMENDED. Use this role for a voice/video call or a live broadcast.
       * - Role.SUBSCRIBER: ONLY use this role if your live-broadcast scenario requires authentication for [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication). In order for this role to take effect, please contact our support team to enable authentication for Co-host for you. Otherwise, Role_Subscriber still has the same privileges as Role_Publisher.
       * @param {*} tokenExpire epresented by the number of seconds elapsed since now. If, for example, you want to access the Agora Service within 10 minutes after the token is generated, set tokenExpire as 600(seconds)
       * @param {*} privilegeExpire represented by the number of seconds elapsed since now. If, for example, you want to enable your privilege for 10 minutes, set privilegeExpire as 600(seconds).
       * @return The RTC Token.
       */
      static buildTokenWithUid(appId, appCertificate, channelName, uid, role, tokenExpire, privilegeExpire = 0) {
        return this.buildTokenWithUserAccount(
          appId,
          appCertificate,
          channelName,
          uid,
          role,
          tokenExpire,
          privilegeExpire
        );
      }
      /**
       * Builds an RTC token with account.
       * @param {*} appId  The App ID issued to you by Agora.
       * @param {*} appCertificate Certificate of the application that you registered in the Agora Dashboard.
       * @param {*} channelName The unique channel name for the AgoraRTC session in the string format. The string length must be less than 64 bytes. Supported character scopes are:
       * - The 26 lowercase English letters: a to z.
       * - The 26 uppercase English letters: A to Z.
       * - The 10 digits: 0 to 9.
       * - The space.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param {*} account The user account.
       * @param {*} role See #userRole.
       * - Role.PUBLISHER; RECOMMENDED. Use this role for a voice/video call or a live broadcast.
       * - Role.SUBSCRIBER: ONLY use this role if your live-broadcast scenario requires authentication for [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication). In order for this role to take effect, please contact our support team to enable authentication for Co-host for you. Otherwise, Role_Subscriber still has the same privileges as Role_Publisher.
       * @param {*} tokenExpire epresented by the number of seconds elapsed since now. If, for example, you want to access the Agora Service within 10 minutes after the token is generated, set tokenExpire as 600(seconds)
       * @param {*} privilegeExpire represented by the number of seconds elapsed since now. If, for example, you want to enable your privilege for 10 minutes, set privilegeExpire as 600(seconds).
       * @return The RTC Token.
       */
      static buildTokenWithUserAccount(appId, appCertificate, channelName, account, role, tokenExpire, privilegeExpire = 0) {
        let token = new AccessToken(appId, appCertificate, 0, tokenExpire);
        let serviceRtc = new ServiceRtc(channelName, account);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, privilegeExpire);
        if (role == Role.PUBLISHER) {
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, privilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, privilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, privilegeExpire);
        }
        token.add_service(serviceRtc);
        return token.build();
      }
      /**
       * Generates an RTC token with the specified privilege.
       *
       * This method supports generating a token with the following privileges:
       * - Joining an RTC channel.
       * - Publishing audio in an RTC channel.
       * - Publishing video in an RTC channel.
       * - Publishing data streams in an RTC channel.
       *
       * The privileges for publishing audio, video, and data streams in an RTC channel apply only if you have
       * enabled co-host authentication.
       *
       * A user can have multiple privileges. Each privilege is valid for a maximum of 24 hours.
       * The SDK triggers the onTokenPrivilegeWillExpire and onRequestToken callbacks when the token is about to expire
       * or has expired. The callbacks do not report the specific privilege affected, and you need to maintain
       * the respective timestamp for each privilege in your app logic. After receiving the callback, you need
       * to generate a new token, and then call renewToken to pass the new token to the SDK, or call joinChannel to re-join
       * the channel.
       *
       * @note
       * Agora recommends setting a reasonable timestamp for each privilege according to your scenario.
       * Suppose the expiration timestamp for joining the channel is set earlier than that for publishing audio.
       * When the token for joining the channel expires, the user is immediately kicked off the RTC channel
       * and cannot publish any audio stream, even though the timestamp for publishing audio has not expired.
       *
       * @param appId The App ID of your Agora project.
       * @param appCertificate The App Certificate of your Agora project.
       * @param channelName The unique channel name for the Agora RTC session in string format. The string length must be less than 64 bytes. The channel name may contain the following characters:
       * - All lowercase English letters: a to z.
       * - All uppercase English letters: A to Z.
       * - All numeric characters: 0 to 9.
       * - The space character.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param uid The user ID. A 32-bit unsigned integer with a value range from 1 to (2^32 - 1). It must be unique. Set uid as 0, if you do not want to authenticate the user ID, that is, any uid from the app client can join the channel.
       * @param tokenExpire represented by the number of seconds elapsed since now. If, for example, you want to access the
       * Agora Service within 10 minutes after the token is generated, set tokenExpire as 600(seconds).
       * @param joinChannelPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to join channel and expect stay in the channel for 10 minutes, set joinChannelPrivilegeExpire as 600(seconds).
       * @param pubAudioPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish audio privilege for 10 minutes, set pubAudioPrivilegeExpire as 600(seconds).
       * @param pubVideoPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish video privilege for 10 minutes, set pubVideoPrivilegeExpire as 600(seconds).
       * @param pubDataStreamPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish data stream privilege for 10 minutes, set pubDataStreamPrivilegeExpire as 600(seconds).
       * @return The RTC Token
       */
      static buildTokenWithUidAndPrivilege(appId, appCertificate, channelName, uid, tokenExpire, joinChannelPrivilegeExpire, pubAudioPrivilegeExpire, pubVideoPrivilegeExpire, pubDataStreamPrivilegeExpire) {
        return this.BuildTokenWithUserAccountAndPrivilege(
          appId,
          appCertificate,
          channelName,
          uid,
          tokenExpire,
          joinChannelPrivilegeExpire,
          pubAudioPrivilegeExpire,
          pubVideoPrivilegeExpire,
          pubDataStreamPrivilegeExpire
        );
      }
      /**
       * Generates an RTC token with the specified privilege.
       *
       * This method supports generating a token with the following privileges:
       * - Joining an RTC channel.
       * - Publishing audio in an RTC channel.
       * - Publishing video in an RTC channel.
       * - Publishing data streams in an RTC channel.
       *
       * The privileges for publishing audio, video, and data streams in an RTC channel apply only if you have
       * enabled co-host authentication.
       *
       * A user can have multiple privileges. Each privilege is valid for a maximum of 24 hours.
       * The SDK triggers the onTokenPrivilegeWillExpire and onRequestToken callbacks when the token is about to expire
       * or has expired. The callbacks do not report the specific privilege affected, and you need to maintain
       * the respective timestamp for each privilege in your app logic. After receiving the callback, you need
       * to generate a new token, and then call renewToken to pass the new token to the SDK, or call joinChannel to re-join
       * the channel.
       *
       * @note
       * Agora recommends setting a reasonable timestamp for each privilege according to your scenario.
       * Suppose the expiration timestamp for joining the channel is set earlier than that for publishing audio.
       * When the token for joining the channel expires, the user is immediately kicked off the RTC channel
       * and cannot publish any audio stream, even though the timestamp for publishing audio has not expired.
       *
       * @param appId The App ID of your Agora project.
       * @param appCertificate The App Certificate of your Agora project.
       * @param channelName The unique channel name for the Agora RTC session in string format. The string length must be less than 64 bytes. The channel name may contain the following characters:
       * - All lowercase English letters: a to z.
       * - All uppercase English letters: A to Z.
       * - All numeric characters: 0 to 9.
       * - The space character.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param userAccount The user account.
       * @param tokenExpire represented by the number of seconds elapsed since now. If, for example, you want to access the
       * Agora Service within 10 minutes after the token is generated, set tokenExpire as 600(seconds).
       * @param joinChannelPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to join channel and expect stay in the channel for 10 minutes, set joinChannelPrivilegeExpire as 600(seconds).
       * @param pubAudioPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish audio privilege for 10 minutes, set pubAudioPrivilegeExpire as 600(seconds).
       * @param pubVideoPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish video privilege for 10 minutes, set pubVideoPrivilegeExpire as 600(seconds).
       * @param pubDataStreamPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish data stream privilege for 10 minutes, set pubDataStreamPrivilegeExpire as 600(seconds).
       * @return The RTC Token.
       */
      static BuildTokenWithUserAccountAndPrivilege(appId, appCertificate, channelName, account, tokenExpire, joinChannelPrivilegeExpire, pubAudioPrivilegeExpire, pubVideoPrivilegeExpire, pubDataStreamPrivilegeExpire) {
        let token = new AccessToken(appId, appCertificate, 0, tokenExpire);
        let serviceRtc = new ServiceRtc(channelName, account);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, joinChannelPrivilegeExpire);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, pubAudioPrivilegeExpire);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, pubVideoPrivilegeExpire);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, pubDataStreamPrivilegeExpire);
        token.add_service(serviceRtc);
        return token.build();
      }
      /**
       * Build an RTC and RTM token with account.
       * @param {*} appId  The App ID issued to you by Agora.
       * @param {*} appCertificate Certificate of the application that you registered in the Agora Dashboard.
       * @param {*} channelName The unique channel name for the AgoraRTC session in the string format. The string length must be less than 64 bytes. Supported character scopes are:
       * - The 26 lowercase English letters: a to z.
       * - The 26 uppercase English letters: A to Z.
       * - The 10 digits: 0 to 9.
       * - The space.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param {*} account The user account.
       * @param {*} role See #userRole.
       * - Role.PUBLISHER; RECOMMENDED. Use this role for a voice/video call or a live broadcast.
       * - Role.SUBSCRIBER: ONLY use this role if your live-broadcast scenario requires authentication for [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication). In order for this role to take effect, please contact our support team to enable authentication for Co-host for you. Otherwise, Role_Subscriber still has the same privileges as Role_Publisher.
       * @param {*} tokenExpire epresented by the number of seconds elapsed since now. If, for example, you want to access the Agora Service within 10 minutes after the token is generated, set tokenExpire as 600(seconds)
       * @param {*} privilegeExpire represented by the number of seconds elapsed since now. If, for example, you want to enable your privilege for 10 minutes, set privilegeExpire as 600(seconds).
       * @return The RTC and RTM Token.
       */
      static buildTokenWithRtm(appId, appCertificate, channelName, account, role, tokenExpire, privilegeExpire = 0) {
        let token = new AccessToken(appId, appCertificate, 0, tokenExpire);
        let serviceRtc = new ServiceRtc(channelName, account);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, privilegeExpire);
        if (role == Role.PUBLISHER) {
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, privilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, privilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, privilegeExpire);
        }
        token.add_service(serviceRtc);
        let serviceRtm = new ServiceRtm(account);
        serviceRtm.add_privilege(ServiceRtm.kPrivilegeLogin, tokenExpire);
        token.add_service(serviceRtm);
        return token.build();
      }
      /**
       * Build an RTC and RTM token with account.
       * @param {*} appId  The App ID issued to you by Agora.
       * @param {*} appCertificate Certificate of the application that you registered in the Agora Dashboard.
       * @param {*} channelName The unique channel name for the AgoraRTC session in the string format. The string length must be less than 64 bytes. Supported character scopes are:
       * - The 26 lowercase English letters: a to z.
       * - The 26 uppercase English letters: A to Z.
       * - The 10 digits: 0 to 9.
       * - The space.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param {*} rtcAccount The RTC user's account, max length is 255 Bytes.
       * @param {*} rtcRole See #userRole.
       * - Role.PUBLISHER; RECOMMENDED. Use this role for a voice/video call or a live broadcast.
       * - Role.SUBSCRIBER: ONLY use this role if your live-broadcast scenario requires authentication for [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication). In order for this role to take effect, please contact our support team to enable authentication for Co-host for you. Otherwise, Role_Subscriber still has the same privileges as Role_Publisher.
       * @param {*} rtcTokenExpire epresented by the number of seconds elapsed since now. If, for example, you want to access the Agora Service within 10 minutes after the token is generated, set tokenExpire as 600(seconds)
       * @param {*} joinChannelPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to join channel and expect stay in the channel for 10 minutes, set joinChannelPrivilegeExpire as 600(seconds).
       * @param {*} pubAudioPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish audio privilege for 10 minutes, set pubAudioPrivilegeExpire as 600(seconds).
       * @param {*} pubVideoPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish video privilege for 10 minutes, set pubVideoPrivilegeExpire as 600(seconds).
       * @param {*} pubDataStreamPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish data stream privilege for 10 minutes, set pubDataStreamPrivilegeExpire as 600(seconds).
       * @param {*} rtmUserId: The RTM user's account, max length is 255 Bytes.
       * @param {*} rtmTokenExpire: represented by the number of seconds elapsed since now. If, for example,
       * you want to access the Agora Service within 10 minutes after the token is generated, set rtmTokenExpire as 600(seconds).
       * * @return The RTC and RTM Token.
       */
      static buildTokenWithRtm2(appId, appCertificate, channelName, rtcAccount, rtcRole, rtcTokenExpire, joinChannelPrivilegeExpire, pubAudioPrivilegeExpire, pubVideoPrivilegeExpire, pubDataStreamPrivilegeExpire, rtmUserId, rtmTokenExpire) {
        let token = new AccessToken(appId, appCertificate, 0, rtcTokenExpire);
        let serviceRtc = new ServiceRtc(channelName, rtcAccount);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, joinChannelPrivilegeExpire);
        if (rtcRole == Role.PUBLISHER) {
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, pubAudioPrivilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, pubVideoPrivilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, pubDataStreamPrivilegeExpire);
        }
        token.add_service(serviceRtc);
        let serviceRtm = new ServiceRtm(rtmUserId);
        serviceRtm.add_privilege(ServiceRtm.kPrivilegeLogin, rtmTokenExpire);
        token.add_service(serviceRtm);
        return token.build();
      }
    }, "RtcTokenBuilder2");
    __name2(RtcTokenBuilder2, "RtcTokenBuilder");
    module.exports.RtcTokenBuilder = RtcTokenBuilder2;
    module.exports.Role = Role;
  }
});
var require_RtmTokenBuilder2 = __commonJS({
  "../node_modules/agora-token/src/RtmTokenBuilder2.js"(exports, module) {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceRtm = require_AccessToken2().ServiceRtm;
    var RtmTokenBuilder = /* @__PURE__ */ __name(class {
      /**
       * Build the RTM token.
       *
       * @param appId The App ID issued to you by Agora. Apply for a new App ID from
       * Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       * the Agora Dashboard. See Get an App Certificate.
       * @param userId The user's account, max length is 64 Bytes.
       * @param expire represented by the number of seconds elapsed since now. If, for example, you want to access the
       * Agora Service within 10 minutes after the token is generated, set expire as 600(seconds).
       * @return The RTM token.
       */
      static buildToken(appId, appCertificate, userId, expire) {
        let token = new AccessToken(appId, appCertificate, null, expire);
        let serviceRtm = new ServiceRtm(userId);
        serviceRtm.add_privilege(ServiceRtm.kPrivilegeLogin, expire);
        token.add_service(serviceRtm);
        return token.build();
      }
    }, "RtmTokenBuilder");
    __name2(RtmTokenBuilder, "RtmTokenBuilder");
    module.exports.RtmTokenBuilder = RtmTokenBuilder;
  }
});
var require_agora_token = __commonJS({
  "../node_modules/agora-token/index.js"(exports, module) {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = {
      ApaasTokenBuilder: require_ApaasTokenBuilder().ApaasTokenBuilder,
      ChatTokenBuilder: require_ChatTokenBuilder().ChatTokenBuilder,
      EducationTokenBuilder: require_EducationTokenBuilder().EducationTokenBuilder,
      FpaTokenBuilder: require_FpaTokenBuilder().FpaTokenBuilder,
      RtcRole: require_RtcTokenBuilder2().Role,
      RtcTokenBuilder: require_RtcTokenBuilder2().RtcTokenBuilder,
      RtmTokenBuilder: require_RtmTokenBuilder2().RtmTokenBuilder
    };
  }
});
function corsHeaders2() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };
}
__name(corsHeaders2, "corsHeaders2");
async function onRequestOptions2() {
  return new Response("", { status: 200, headers: corsHeaders2() });
}
__name(onRequestOptions2, "onRequestOptions2");
async function onRequest(context22) {
  const { request, env: env22 } = context22;
  const headers = corsHeaders2();
  const APP_ID = env22.AGORA_APP_ID;
  const APP_CERTIFICATE = env22.AGORA_APP_CERTIFICATE;
  if (!APP_ID || !APP_CERTIFICATE) {
    return new Response(
      JSON.stringify({ error: "Server is missing AGORA_APP_ID or AGORA_APP_CERTIFICATE environment variables." }),
      { status: 500, headers }
    );
  }
  try {
    let channelName, uid;
    if (request.method === "GET") {
      const url = new URL(request.url);
      channelName = url.searchParams.get("channel");
      uid = url.searchParams.get("uid");
    } else {
      const body = await request.json().catch(() => ({}));
      channelName = body.channel;
      uid = body.uid;
    }
    uid = uid != null ? String(uid) : "0";
    if (!channelName) {
      return new Response(JSON.stringify({ error: "Missing 'channel' parameter." }), { status: 400, headers });
    }
    const expireSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1e3);
    const privilegeExpireTs = currentTimestamp + expireSeconds;
    if (!import_agora_token.RtcTokenBuilder) {
      throw new Error("agora-token package did not export RtcTokenBuilder.");
    }
    let token;
    if (typeof import_agora_token.RtcTokenBuilder.buildTokenWithAccount === "function") {
      token = import_agora_token.RtcTokenBuilder.buildTokenWithAccount(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid,
        import_agora_token.RtcRole.PUBLISHER,
        privilegeExpireTs,
        privilegeExpireTs
      );
    } else if (typeof import_agora_token.RtcTokenBuilder.buildTokenWithUserAccount === "function") {
      token = import_agora_token.RtcTokenBuilder.buildTokenWithUserAccount(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid,
        import_agora_token.RtcRole.PUBLISHER,
        privilegeExpireTs,
        privilegeExpireTs
      );
    } else if (typeof import_agora_token.RtcTokenBuilder.buildTokenWithUid === "function") {
      let numericUid = 0;
      for (let i = 0; i < uid.length; i++) {
        numericUid = (numericUid * 31 + uid.charCodeAt(i)) % 2147483647;
      }
      token = import_agora_token.RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        numericUid,
        import_agora_token.RtcRole.PUBLISHER,
        privilegeExpireTs,
        privilegeExpireTs
      );
    } else {
      const available = Object.getOwnPropertyNames(import_agora_token.RtcTokenBuilder).filter((n) => typeof import_agora_token.RtcTokenBuilder[n] === "function");
      throw new Error("No recognized token-building method found. Available: " + available.join(", "));
    }
    return new Response(
      JSON.stringify({ token, appId: APP_ID, channel: channelName, uid, expiresAt: privilegeExpireTs }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to generate token: " + err.message }), { status: 500, headers });
  }
}
__name(onRequest, "onRequest");
var import_agora_token;
var init_generate_agora_token = __esm({
  "generate-agora-token.js"() {
    init_functionsRoutes_0_4671197783553819();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    import_agora_token = __toESM(require_agora_token());
    __name2(corsHeaders2, "corsHeaders");
    __name2(onRequestOptions2, "onRequestOptions");
    __name2(onRequest, "onRequest");
  }
});
var routes;
var init_functionsRoutes_0_4671197783553819 = __esm({
  "../.wrangler/tmp/pages-TJ9wkg/functionsRoutes-0.4671197783553819.mjs"() {
    init_ask_assistant();
    init_ask_assistant();
    init_generate_agora_token();
    init_generate_agora_token();
    routes = [
      {
        routePath: "/ask-assistant",
        mountPath: "/",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions]
      },
      {
        routePath: "/ask-assistant",
        mountPath: "/",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost]
      },
      {
        routePath: "/generate-agora-token",
        mountPath: "/",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions2]
      },
      {
        routePath: "/generate-agora-token",
        mountPath: "/",
        method: "",
        middlewares: [],
        modules: [onRequest]
      }
    ];
  }
});
init_functionsRoutes_0_4671197783553819();
init_strip_cf_connecting_ip_header();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_functionsRoutes_0_4671197783553819();
init_strip_cf_connecting_ip_header();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_functionsRoutes_0_4671197783553819();
init_strip_cf_connecting_ip_header();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_functionsRoutes_0_4671197783553819();
init_strip_cf_connecting_ip_header();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count32 = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count32--;
          if (count32 === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count32++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count32)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env22, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context22 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env22,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: () => {
            isFailOpen = true;
          }
        };
        const response = await handler(context22);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env22["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error32) {
      if (isFailOpen) {
        const response = await env22["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error32;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
init_functionsRoutes_0_4671197783553819();
init_strip_cf_connecting_ip_header();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var drainBody = /* @__PURE__ */ __name2(async (request, env22, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env22);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
init_functionsRoutes_0_4671197783553819();
init_strip_cf_connecting_ip_header();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env22, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env22);
  } catch (e) {
    const error32 = reduceError(e);
    return Response.json(error32, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
init_functionsRoutes_0_4671197783553819();
init_strip_cf_connecting_ip_header();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env22, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env22, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env22, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env22, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = /* @__PURE__ */ __name(class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
}, "__Facade_ScheduledController__");
__name2(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env22, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env22, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env22, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env22, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env22, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env22, ctx) => {
      this.env = env22;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env3, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env3);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env3, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env3);
  } catch (e) {
    const error4 = reduceError2(e);
    return Response.json(error4, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-kcVwvt/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env3, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env3, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env3, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env3, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-kcVwvt/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__2, "__Facade_ScheduledController__");
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env3, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env3, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env3, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env3, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env3, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env3, ctx) => {
      this.env = env3;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
/*! Bundled license information:

is-buffer/index.js:
  (*!
   * Determine if an object is a Buffer
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   *)
*/
//# sourceMappingURL=functionsWorker-0.3584173084810205.js.map
