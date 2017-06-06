# jaeger-node

Out of the box distributed tracing for Node.js applications.

**WARNING: do not use in production yet**

## Technologies

- [async_hooks](https://github.com/nodejs/node/blob/master/doc/api/async_hooks.md)
- [Jaeger](https://uber.github.io/jaeger/)
- [OpenTracing](http://opentracing.io/)

**Requirements**

- Node.js, >= v8
- Jaeger

## Getting started

```js
// must be in the first two lines of your application
const Tracer = require('@risingstack/jaeger')
const tracer = new Tracer({
  serviceName: 'my-server-2',
  tags: {
    gitTag: 'foobar'
  }
})

// rest of your code
const express = require('express')
// ...
```

**To start Jaeger and visit it's dashboard:**

```sh
docker run -d -p5775:5775/udp -p6831:6831/udp -p6832:6832/udp -p5778:5778 -p16686:16686 -p14268:14268 jaegertracing/all-in-one:latest && open http://localhost:16686
```

## Example

```sh
node example/server1.js
node example/server2.js
```

![Jaeger Node.js tracing](https://cloud.githubusercontent.com/assets/1764512/26815965/989ffa00-4a8f-11e7-888d-4e3bb380f2ad.png)

## API

### new Tracer(options)

Create a new Tracer and instrument modules.

- `options.serviceName`: Name of your service
  - **required**
  - example: `'my-service-1'`
- `options.tags`: Meta tags
  - *optional*
  - example: `{ gitHash: 'foobar' }`
- `options.maxSamplesPerSecond`: maximum number of samples per second
  - *optional*
  - default: `1`
- `options.sender`: sender configuration *(Your Jaeger backend)*
  - *optional*
  - default: `{ host: 'localhost', port: 6832, maxPacketSize: 65000 }`

## Instrumentations

- [http](https://nodejs.org/api/http.html)
- [express](https://expressjs.com/)

## Known issues

- `EMSGSIZE` can be reached easily: [related issue](https://github.com/uber/jaeger-client-node/issues/124)

## TODO

- database instrumentation: MongoDB, PG, MySQL, Redis etc.
- messaging broker instrumentation: RabbitMQ, Kafka etc.
- test coverage
- multiple sampling algorithms
