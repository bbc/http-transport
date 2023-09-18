import Request from './request.js';
import Response from './response.js';
import { readFile } from 'fs/promises';
const { name, version } = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url))
);

const RETRIES = 0;
const RETRY_DELAY = 100;
const USER_AGENT = `${name}/${version}`;

class Context {
  constructor(defaults) {
    this.retries = 0;
    this._retryAttempts = [];
    this.plugins = [];
    this.req = Request.create();
    this.res = Response.create();
    if (defaults) this._applyDefaults(defaults);
  }

  get retryAttempts() {
    return this._retryAttempts || [];
  }

  set retryAttempts(retryAttempts) {
    if (!Array.isArray(retryAttempts)) {
      retryAttempts = [];
    }
    this._retryAttempts = retryAttempts;
  }

  addPlugin(plugin) {
    this.plugins.push(plugin);
    return this;
  }

  _applyDefaults(defaults) {
    this.userAgent = defaults.ctx?.userAgent || USER_AGENT;
    this.retries = defaults.ctx?.retries || RETRIES;
    this.retryDelay = defaults.ctx?.retryDelay || RETRY_DELAY;
  }

  static create(defaults) {
    return new Context(defaults);
  }
}

export default Context;
