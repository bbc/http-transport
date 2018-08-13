export declare function createBuilder(transport?: Transport): HttpTransportBuilder;
export declare function createClient(): HttpTransportClient;

export declare type plugin = (ctx: Context, next: plugin) => any;
export declare type headers = Object;
export declare type query = Object;
export declare type body = string;
export declare type requestOptions = Object;
export declare type response = Object;
export declare type errorObject = {
  message: string
}

export declare type ResponseProps = {
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
export declare function toJson(opts: toJsonOpts): plugin
export declare function logger(logger?: any): plugin
export declare function setContextProperty(opts: any, path: string): plugin

export declare class Request {
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

export declare class Response {
  readonly length: number
  static create(opts?: ResponseProps): Response
  addHeader(key: string, value: string): Request
  getHeader(key: string): string
  toJson(): ResponseProps
}

export declare class HttpTransportCallbackClient {
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

export declare class HttpTransportBuilder {
  userAgent(userAgent: string): HttpTransportBuilder
  retries(retries: number): HttpTransportBuilder
  retryDelay(retryDelay: number): HttpTransportBuilder
  use(fn: plugin): HttpTransportBuilder
  asCallback(): HttpTransportBuilder
  createClient(): HttpTransportClient | HttpTransportCallbackClient
}

export declare class HttpTransportClient {
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
  retryAttempts: Array<any>
  addPlugin(plugin: plugin): Context
}

export declare class RequestTransport extends Transport { }

export declare class Transport {
  toError(err: errorObject, ctx: Context): Error
  createError(err: errorObject, ctx: Context): Error
  execute(ctx: Context): Promise<RequestTransport>
  onError(ctx: Context): Function
  toOptions(ctx: Context): requestOptions
  toResponse(ctx: Context, from: response): response
  makeRequest(ctx: Context, opts: requestOptions): Promise<response>
}

export declare var defaultTransport: RequestTransport;
export declare var builder: HttpTransportBuilder;
export declare var transport: Transport;
export declare var context: Context;