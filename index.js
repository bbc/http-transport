'use strict';

const HttpTransportBuilder = require('./lib/builder');
const DefaultTransport = require('./lib/transport/request');

module.exports.defaultTransport = DefaultTransport;
module.exports.builder = HttpTransportBuilder;
module.exports.transport = require('./lib/transport/transport');
module.exports.context = require('./lib/context');
module.exports.toJson = require('./lib/middleware/asJson');
module.exports.logger = require('./lib/middleware/logger');
module.exports.setContextProperty = require('./lib/middleware/setContextProperty');

module.exports.createClient = () => {
  return new HttpTransportBuilder(new DefaultTransport()).createClient();
};

module.exports.createBuilder = (transport) => {
  return new HttpTransportBuilder(transport || new DefaultTransport());
};
