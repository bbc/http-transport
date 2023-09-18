import HttpTransportBuilder from './lib/builder.js';
import DefaultTransport from './lib/transport/node-fetch.js';
import transport from './lib/transport/transport.js';
import context from './lib/context.js';
import toJson from './lib/middleware/asJson.js';
import logger from './lib/middleware/logger.js';
import setContextProperty from './lib/middleware/setContextProperty.js';

export default {
  defaultTransport: DefaultTransport,
  FetchTransport: DefaultTransport,
  builder: HttpTransportBuilder,
  transport,
  context,
  toJson,
  logger,
  setContextProperty,
  createClient: () => {
    return new HttpTransportBuilder(new DefaultTransport()).createClient();
  },
  createBuilder: (transport) => {
    return new HttpTransportBuilder(transport || new DefaultTransport());
  }
}
