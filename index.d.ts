declare function createBuilder(transport?: Transport): HttpTransportBuilder;
declare function createClient(): HttpTransportClient;

declare type plugin = (ctx: Context, next: plugin) => any;
declare type headers = Object;
declare type query = Object;
declare type body = string;
declare type requestOptions = Object;
declare type response = Object;
declare type errorObject = {
  message: string
}

declare type ResponseProps = {
  body: string
  elapsedTime: number
  url: string
  headers: Object
  statusCode: number
}

declare type contextDefaults = {
  userAgent?: string
  retries?: number
  retryDelay?: number
}

declare type toJsonOpts = {
  throwOnConflict?: boolean,
  force?: boolean
}

declare enum method {
  get,
  set,
  put,
  patch,
  delete,
  head,
  options
}

declare type callbackFunction = (err: any, value?: any) => void
declare function toJson(opts: toJsonOpts): plugin
declare function logger(logger?: any): plugin
declare function setContextProperty(opts: any, path: string): plugin

declare class Request {
  addQuery(key: string, value: string): Request
  addHeader(key: string, value: string): Request
  body(content: string): Request
  method(method: method): Request
  baseUrl(baseUrl: string): Request
  timeout(timeout: number): Request
  getMethod(): method
  getTimeout(): number
  getUrl(): string
  getRequestKey(): string
  getHeaders(): Object
  getQueries(): Object
  hasQueries(): boolean
  hasBaseQueries(): boolean
  hasHeaders(): boolean
  getBody(): string
  create(): Request
}

declare class Response {
  readonly length: number 
  static create(opts?: ResponseProps): Response
  addHeader(key: string, value: string): Request
  getHeader(key: string): string
  toJson(): ResponseProps
}

declare class HttpTransportCallbackClient {
  use(fn: plugin): HttpTransportCallbackClient
  get(baseUrl: string): HttpTransportCallbackClient
  post(baseUrl: string, body: string): HttpTransportCallbackClient
  patch(baseUrl: string, body: string): HttpTransportCallbackClient
  put(baseUrl: string, body: string): HttpTransportCallbackClient
  delete(baseUrl: string): HttpTransportCallbackClient
  head(baseUrl: string): HttpTransportCallbackClient
  headers(headers: headers): HttpTransportCallbackClient
  query(query: query): HttpTransportCallbackClient
  timeout(timeout: number): HttpTransportCallbackClient
  retries(retries: number): HttpTransportCallbackClient
  retryDelay(retryDelay: number): HttpTransportCallbackClient
  asResponse(cb: callbackFunction): Promise<response>
  asBody(cb: callbackFunction): Promise<body>
}

declare class HttpTransportBuilder {
  userAgent(userAgent: string): HttpTransportBuilder
  retries(retries: number): HttpTransportBuilder
  retryDelay(retryDelay: number): HttpTransportBuilder
  use(fn: plugin): HttpTransportBuilder
  asCallback(): HttpTransportBuilder
  createClient(): HttpTransportClient | HttpTransportCallbackClient
}

declare class HttpTransportClient {
  use(fn: plugin): HttpTransportClient
  get(baseUrl: string): HttpTransportClient
  post(baseUrl: string, body: string): HttpTransportClient
  patch(baseUrl: string, body: string): HttpTransportClient
  put(baseUrl: string, body: string): HttpTransportClient
  delete(baseUrl: string): HttpTransportClient
  head(baseUrl: string): HttpTransportClient
  headers(headers: headers): HttpTransportClient
  query(query: query): HttpTransportClient
  timeout(timeout: number): HttpTransportClient
  retries(retries: number): HttpTransportClient
  retryDelay(retryDelay: number): HttpTransportClient
  asBody(): Promise<body>
  asResponse(): Promise<response>
}

declare class Context {
  plugins: plugin[]
  req: Request
  res: Response

  static create(defaults: contextDefaults)
  retryAttempts: []
  addPlugin(plugin: plugin): Context
}

declare class RequestTransport extends Transport {}

declare class Transport {
  toError(err: errorObject, ctx: Context): Error
  createError(err: errorObject, ctx: Context): Error
  execute(ctx: Context): Promise<RequestTransport>
  onError(ctx: Context): Function
  toOptions(ctx: Context): requestOptions
  toResponse(ctx: Context, from: response): response
  makeRequest(ctx: Context, opts: requestOptions): Promise<response>
}

export = {
  defaultTransport: RequestTransport,
  builder: HttpTransportBuilder,
  transport: Transport,
  context: Context,
  toJson: toJson,
  logger: logger,
  setContextProperty: setContextProperty,
  createClient: createClient,
  createBuilder: createBuilder
}