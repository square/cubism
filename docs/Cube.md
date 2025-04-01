> [Wiki](Home) ▸ [API Reference](API-Reference) ▸ <b>Cube</b>

A source for [Cube](http://square.github.io/cube/) metrics. To create a source, first create a [context](Context). Then, use [context.cube](Context#wiki-cube) to specify the URL of the Cube evaluator. For example:

```js
var context = cubism.context(), // a default context
    cube = context.cube("http://cube.example.com");
```

<a name="metric" href="#wiki-metric">#</a> cube.<b>metric</b>(<i>expression</i>)

Creates a new [metric](Metric) for the given Cube <i>expression</i>. For example, if you were using Cube to collect "request" events, you could query the number of request events by saying:

```js
var requests = cube.metric("sum(request)");
```

For more information on metric expressions, see [Cube's documentation](/square/cube/wiki/Queries).

<a name="toString" href="#wiki-toString">#</a> cube.<b>toString</b>()

Returns the URL of the Cube server; the first argument to the [constructor](#wiki-cube).