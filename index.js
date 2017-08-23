'use strict';

const Client = require('./lib/client');
const DEFAULT_TRANSPORT = require('./lib/transport/request');

module.exports.transport = require('./lib/transport/transport');
module.exports.context = require('./lib/context');
module.exports.toJson = require('./lib/plugins/asJson');
module.exports.logger = require('./lib/plugins/logger');

module.exports.createClient = (httpTransport) => new Client(httpTransport || this.getDefaultTransport());

module.exports.getDefaultTransport = () => {
  return new DEFAULT_TRANSPORT;
};
