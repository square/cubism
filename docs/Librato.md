> [Wiki](Home) ▸ [API Reference](API-Reference) ▸ <b>Librato</b>

A source for [Librato](https://metrics.librato.com/sign_in) metrics. To create a source, first create a [context](Context). Then, use [context.librato](Context#wiki-cube) to specify your librato credentials. For example:

```js
var context = cubism.context(), // a default context
    librato = context.librato("foo@gmail.com", "8585ae5c30d55ddef4");
```

<a name="metric" href="#wiki-metric">#</a> librato.<b>metric</b>(<i>metric name</i>, <i>source</i>)

Creates a new [metric](Metric) for the given librato [composite metric query](http://support.metrics.librato.com/knowledgebase/articles/337431-composite-metrics-language-specification). For example:

```js
var metrics = librato.metric("sum(series(\"hgsc_cpu_used\",  \"ardmore\"))");
```

