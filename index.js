'use strict';

const HttpTransportClient = require('./lib/client');
const HttpTransportBuilder = require('./lib/builder');
const DefaultTransport = require('./lib/transport/request');

module.exports.transport = require('./lib/transport/transport');
module.exports.defaultTransport = DefaultTransport;
module.exports.context = require('./lib/context');
module.exports.toJson = require('./lib/plugins/asJson');
module.exports.logger = require('./lib/plugins/logger');
module.exports.setContextProperty = require('./lib/plugins/setContextProperty');

module.exports.createClient = () => {
  return new HttpTransportClient(new DefaultTransport());
};

module.exports.createBuilder = (transport) => {
  return new HttpTransportBuilder(transport || new DefaultTransport());
};
