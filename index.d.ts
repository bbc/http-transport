declare function createBuilder(transport: Transport): HttpTransportBuilder;
declare function createClient(): HttpTransportClient;

declare type plugin = Function;
declare type headers = Object;
declare type query = Object;
declare type body = string;
declare type requestOptions = Object;
declare type response = Object;
declare type errorObject = {
  message: string
}
declare type contextDefaults = {
  userAgent: string
  retries: number
  retryDelay: number
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

}


declare class HttpTransportBuilder {
  userAgent(userAgent: string): HttpTransportBuilder
  retries(retries: number): HttpTransportBuilder
  retryDelay(retryDelay: number): HttpTransportBuilder
  use(fn: plugin): HttpTransportBuilder
  asCallback(): HttpTransportBuilder
}

declare class HttpTransportClient {
  use(fn: plugin): HttpTransportBuilder
  get(baseUrl: string): HttpTransportBuilder
  post(baseUrl: string, body: string): HttpTransportBuilder
  patch(baseUrl: string, body: string): HttpTransportBuilder
  put(baseUrl: string, body: string): HttpTransportBuilder
  delete(baseUrl: string): HttpTransportBuilder
  head(baseUrl: string): HttpTransportBuilder
  headers(headers: headers): HttpTransportBuilder
  query(query: query): HttpTransportBuilder
  timeout(timeout: number): HttpTransportBuilder
  retries(retries: number): HttpTransportBuilder
  retryDelay(retryDelay: number): HttpTransportBuilder
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

declare class RequestTransport {

}

declare class Transport {
  toError(err: errorObject, ctx: Context): Error
  createError(err: errorObject, ctx: Context): Error
  execute(ctx: Context): Promise<RequestTransport>
  onError(ctx: Context): Function
  toOptions(ctx: Context): requestOptions
  toResponse(ctx: Context, from: response): response
  makeRequest(ctx: Context, opts: requestOptions): Promise<response>
}