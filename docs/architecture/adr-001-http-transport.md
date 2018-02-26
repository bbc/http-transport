# Architecture Decision Record 001: A new Rest Client - HttpTransport

## Context
We have an open source rest client that are used across multiple teams in the BBC, called [flashheart](https://github.com/bbc/flashheart). Over time we have accumulated a wide range of features, which has now become difficult to maintain as we receive more requests for increased capabilities. This was also noticeable internally, where extending functionality was becoming a problem due to the nature of the existing codebase. We set out to design a new library that can be shared across multiple teams, was easily maintainable and can be extended without making changes and coupling to the core project. 

## Decision
We have come to the decision to build a new library with extensibility in mind, in terms of code and supporting feature/change requests from an open source perspective. In addition to this, we are trying to de-couple ourselves from the underlying http client implementation, which was previously [request](https://github.com/request/request). As such, we have built a lightweight client, agnostic to underlying http implementation. Instead of building features directly into the core client, we have decided to abstract functionality out via middlewares.

## Consequences
* The client feature set and underlying http client is no longer coupled to the core client. This has resulted in a more extensible and flexible client. For example, we can now implement request collapsing without further bloating our client.
* The middleware system and http client abstraction has allowed for a more flexible open source project. 
* The number of projects that we maintain has increased. This can increase complexity of the release process, particuarly for breaking changes. For example, a method signiture change in the HttpTransport would also require an update in the [callback adapter](https://github.com/bbc/http-transport-callbacks)
* Potentially, we can simplify the release process by bundling some of the middlewares by default in HttpTransport. For example, the [http error conversion middleware](https://github.com/bbc/http-transport-to-error) would no longer be a separare project. 
