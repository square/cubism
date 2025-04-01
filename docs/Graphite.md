> [Wiki](Home) ▸ [API Reference](API-Reference) ▸ <b>Graphite</b>

A source for [Graphite](http://graphite.wikidot.com/) metrics. To create a source, first create a [context](Context). Then, use [context.graphite](Context#wiki-graphite) to specify the URL of the Graphite server. For example:

```js
var context = cubism.context(), // a default context
    graphite = context.graphite("http://graphite.example.com");
```

<a name="metric" href="#wiki-metric">#</a> graphite.<b>metric</b>(<i>expression</i>)

Creates a new [metric](Metric) for the given Graphite <i>expression</i>. For example, if you were using Graphite in conjunction with [Collectd](http://collectd.org/)'s [CPU plugin](http://collectd.org/wiki/index.php/Plugin:CPU), you could monitor the CPU utilization of the machine "foo" by saying:

```js
var foo = graphite.metric("sumSeries(nonNegativeDerivative(exclude(hosts.foo.cpu.*.*,'idle')))");
```

For more information on metric expressions, see Graphite's documentation on the [target parameter](http://graphite.readthedocs.org/en/latest/render_api.html#target).

When the step is 10 seconds, the metric is sent to Graphite as-is; for other step intervals, the metric will be summarized automatically using Graphite's [summarize function](http://graphite.readthedocs.org/en/1.0/functions.html#graphite.render.functions.summarize). The default summation function is "sum", but you can change this using the returned metric's summarize function. For example, to summarize using average:

```js
var foo = graphite.metric("foo").summarize("avg");
```

<a name="find" href="#wiki-find">#</a> graphite.<b>find</b>(<i>pattern</i>, <i>callback</i>)

Queries the Graphite server to look for metrics that match the specified <i>pattern</i>, invoking the specified <i>callback</i> when the results are available. The <i>callback</i> is passed two arguments: an <i>error</i>, if any, and an array of string <i>results</i>. For example, to see which hosts have CPU metrics available, you might say:

```js
graphite.find("hosts.*.cpu.0", function(error, results) {
  console.log(results); // ["hosts.foo.cpu.0.", "hosts.bar.cpu.0.", etc.]
});
```

<a name="toString" href="#wiki-toString">#</a> graphite.<b>toString</b>()

Returns the URL of the Graphite server; the first argument to the [constructor](#wiki-graphite).