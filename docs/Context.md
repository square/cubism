> [Wiki](Home) ▸ [API Reference](API-Reference) ▸ <b>Context</b>

A context keeps track of the metric resolution (the [step](#wiki-step), in milliseconds) and the number of metric values to fetch and display (the [size](#wiki-size)). Contexts are the root object of any Cubism dashboard, and are used to create charts and metrics, while keeping them in-sync.

To create a default context, say:

```js
var context = cubism.context();
```

To create a custom context, you might say:

```js
var context = cubism.context()
    .serverDelay(30 * 1000) // allow 30 seconds of collection lag
    .step(5 * 60 * 1000) // five minutes per value
    .size(1920); // fetch 1920 values (1080p)
```

Contexts are required to create sources (such as [Cube](#wiki-cube) and [Graphite](#wiki-graphite)), which are in turn required to create [metrics](Metric). Contexts are also required to create charts (such as [horizon charts](#wiki-horizon) and [comparison charts](#wiki-comparison)).

<a name="step" href="#wiki-step">#</a> context.<b>step</b>([<i>step</i>])

Get or set the context step in milliseconds. If <i>step</i> is specified, sets the new context step and returns the context; if <i>step</i> is not specified, returns the current step. The step defaults to ten seconds (1e4). Note: the step cannot be changed after the context is initialized, which occurs shortly after creation via a brief timeout.

<a name="size" href="#wiki-size">#</a> context.<b>size</b>([<i>size</i>])

Get or set the context size in number of values. If <i>size</i> is specified, sets the new context size and returns the context; if <i>size</i> is not specified, returns the current size. The size defaults to 1440 (four hours at the default step of ten seconds). Note: the size cannot be changed after the context is initialized, which occurs shortly after creation via a brief timeout.

<a name="serverDelay" href="#wiki-serverDelay">#</a> context.<b>serverDelay</b>([<i>delay</i>])

Get or set the context server-side delay in milliseconds. If <i>delay</i> is specified, sets the new context server delay and returns the context; if <i>delay</i> is not specified, returns the current server delay. The server delay defaults to five seconds (5e3). The server delay is the amount of time the context waits for the server to compute or collect metrics. This delay may result from clock skew (either between the client and server, or between the server and the hosts generating metrics) or from delays collecting metrics from various hosts.

<a name="clientDelay" href="#wiki-clientDelay">#</a> context.<b>clientDelay</b>([<i>delay</i>])

Get or set the context client-side delay in milliseconds. If <i>delay</i> is specified, sets the new context client delay and returns the context; if <i>delay</i> is not specified, returns the current client delay. The client delay defaults to five seconds (5e3). The client delay is the amount of additional time the context waits to fetch metrics from the server. The client and server delay combined represent the age of the most recent displayed metric. The client delay exists so that the charts can be redrawn concurrently, rather than redrawing each chart as the associated metric arrives; this reduces the distracting effect of many charts updating simultaneously. Note: the client delay need only consider the expected delay when incrementally fetching the next metric value, not the (typically much more expensive) initial load.

<a name="graphite" href="#wiki-graphite">#</a> context.<b>graphite</b>(<i>url</i>)

Create a source for [Graphite metrics](Graphite).

<a name="cube" href="#wiki-cube">#</a> context.<b>cube</b>(<i>url</i>)

Create a source for [Cube metrics](Cube).

<a name="cube" href="#wiki-librato">#</a> context.<b>librato</b>(<i>user</i>, <i>token</i>)

Create a source for [Librato metrics](Librato).

<a name="constant" href="#wiki-constant">#</a> context.<b>constant</b>(<i>value</i>)

Create a constant-value [metric](Metric). The specified <i>value</i> is coerced to a number.

<a name="horizon" href="#wiki-horizon">#</a> context.<b>horizon</b>()

Create a [horizon chart](Horizon).

<a name="comparison" href="#wiki-comparison">#</a> context.<b>comparison</b>()

Create a [comparison chart](Comparison).

<a name="axis" href="#wiki-axis">#</a> context.<b>axis</b>()

Create an [axis](Axis).

<a name="rule" href="#wiki-rule">#</a> context.<b>rule</b>()

Create a [rule](Rule).

<a name="scale" href="#wiki-scale">#</a> context.<b>scale</b>

The context's <i>x</i>-scale; a [d3.time.scale](/mbostock/d3/wiki/Time-Scales). The domain of the scale is updated automatically immediately before a "change" event is dispatched. The range is likewise set automatically based on the context [size](#wiki-size).

<a name="on" href="#wiki-on">#</a> context.<b>on</b>(<i>type</i>[, <i>listener</i>])

Add, get or remove a listener for context events. This method is typically used only by other Cubism components, but can be used if you want to perform other actions concurrently when new metrics are displayed (such as custom visualizations). The following types of events are supported:

* <b>change</b> events are dispatched at the time new metrics should be displayed. This event is used, for example, by charts to render the new values. Listeners are passed two arguments: the <i>start</i> time (a Date, inclusive) and the <i>stop</i> time (a Date, exclusive). The `this` context of the listener is the context. Note that the <i>stop</i> time will be slightly before the current time (now) based on the [server delay](#wiki-serverDelay) plus the [client delay](#wiki-clientDelay). For example, if the combined delay is five seconds, and the step interval is ten seconds, then change events will be dispatched at :05 seconds past the minute, :15 seconds, :25 seconds, etc.

* <b>beforechange</b> events are dispatched immediately prior to change events; otherwise, they are identical to change events. Listeners are passed two arguments: the <i>start</i> time (a Date, inclusive) and the <i>stop</i> time (a Date, exclusive). The `this` context of the listener is the context. This event is typically used by metrics to shift cached values.

* <b>prepare</b> events are dispatched some time before change events (and before beforechange events), typically to pre-fetch new metric values. Listeners are passed two arguments: the <i>start</i> time (a Date, inclusive) and the <i>stop</i> time (a Date, exclusive). The `this` context of the listener is the context. Note that the <i>stop</i> time will be slightly before the current time (now) based on the [server delay](#wiki-serverDelay). For example, if the server delay is four seconds, and the step interval is ten seconds, then prepare events will be dispatched at :04 seconds past the minute, :14 seconds, :24 seconds, etc.

* <b>focus</b> events are dispatched to coordinate interaction with a particular value. Typically, this event is dispatched in response to a mousemove event on a particular chart. The listener is passed one argument: the focus <i>index</i>, which is a value between 0 (inclusive) and the context size (exclusive). A null value indicates that no value should be focused; often this is interpreted as the latest value (size - 1).

This method follows the same API as D3's [dispatch.on](/mbostock/d3/wiki/Internals#wiki-dispatch_on). If <i>listener</i> is specified and non-null, sets the callback function for events of the specified <i>type</i> and returns the context; any existing listener for the same <i>type</i> will be replaced. If <i>listener</i> is specified and null, clears the callback function for events of the specified <i>type</i> (if any) and returns the context. If <i>listener</i> is not specified, returns the current callback function, if any. The <i>type</i> can be further qualified with a namespace so that multiple listeners can receive the same events; for example, you might use "beforechange.foo" and "beforechange.bar" to register two listeners for beforechange events.

Given an element with the id "update-time", here's how you might display the most recent update time:

```js
context.on("change", function(start, stop) {
  d3.select("#update-time").text("Last updated at " + stop + ".");
});
```

<a name="focus" href="#wiki-focus">#</a> context.<b>focus</b>(<i>index</i>)

Sets the focus <i>index</i> and returns the context. This method also dispatches a "focus" event to all registered listeners. This method is typically called by chart implementations to indicate that the user is interested in a particular time. The <i>index</i> should range from 0 (inclusive) to the context size (exclusive), or have the value null indicating that no particular time is focused.

For example, if you wanted to reposition the horizon charts' value labels on focus, you might say:

```js
context.on("focus", function(i) {
  d3.selectAll(".value").style("right", i == null ? null : context.size() - i + "px");
});
```

<a name="stop" href="#wiki-stop">#</a> context.<b>stop</b>()

Pause the context, stopping any events from being dispatched. Returns the context. This method can be used to dispose of a context, if it is no longer needed.

<a name="start" href="#wiki-start">#</a> context.<b>start</b>()

Resume the context, if it was previously paused. Returns the context.

<a name="metric" href="#wiki-metric">#</a> context.<b>metric</b>(<i>request</i>[, <i>name</i>])

Returns a new metric using the specified <i>request</i> function. If a <i>name</i> is specified, the returned metric's toString function will return the specified <i>name</i>. This method can be used to define a new data source, in case you don't want to use one of the built-in data sources such as [[Graphite]] or [[Cube]]. The <i>request</i> function will be invoked with the <i>start</i> time (a Date), the <i>stop</i> time (another Date), the <i>step</i> interval (a number in milliseconds) and the callback function for when results are available. For example, to implement a metric of random values:

```js
context.metric(function(start, stop, step, callback) {
  var values = [];

  // convert start & stop to milliseconds
  start = +start;
  stop = +stop;

  while (start < stop) {
    start += step;
    values.push(Math.random());
  }

  callback(null, values);
});
```

The result <i>callback</i> takes two arguments, in Node.js convention: an <i>error</i> (which should be null if there was no error, or an Exception if there was), and an array of values (numbers). If some of the data is undefined, the corresponding slots in the array should be NaN.

For another example, see how the built-in [Cube source](/square/cubism/blob/master/src/cube.js#L7-16) is implemented.