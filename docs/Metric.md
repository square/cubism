> [Wiki](Home) ▸ [API Reference](API-Reference) ▸ <b>Metric</b>

A metric; a mechanism for fetching time-series data. To create a metric, you need a context and a source, such as [Cube](Cube) or [Graphite](Graphite). For example:

```js
var context = cubism.context(), // a default context
    cube = context.cube("http://cube.example.com"), // a Cube source
    requests = cube.metric("sum(request)"); // count request events
```

<a name="add" href="#wiki-add">#</a> metric.<b>add</b>(<i>operand</i>)

Derive a new metric by adding this metric to another metric or constant. If <i>operand</i> is a metric, returns a new metric that represents this metric plus <i>operand</i>. Otherwise, <i>operand</i> is implicitly converted to a [constant](Context#wiki-constant).

<a name="subtract" href="#wiki-subtract">#</a> metric.<b>subtract</b>(<i>operand</i>)

Derive a new metric by subtracting another metric or constant from this metric. If <i>operand</i> is a metric, returns a new metric that represents this metric minus <i>operand</i>. Otherwise, <i>operand</i> is implicitly converted to a [constant](Context#wiki-constant).

<a name="multiply" href="#wiki-multiply">#</a> metric.<b>multiply</b>(<i>operand</i>)

Derive a new metric by multiplying this metric by another metric or constant. If <i>operand</i> is a metric, returns a new metric that represents this metric times <i>operand</i>. Otherwise, <i>operand</i> is implicitly converted to a [constant](Context#wiki-constant).

<a name="divide" href="#wiki-divide">#</a> metric.<b>divide</b>(<i>operand</i>)

Derive a new metric by dividing this metric by another metric or constant. If <i>operand</i> is a metric, returns a new metric that represents this metric divided by <i>operand</i>. Otherwise, <i>operand</i> is implicitly converted to a [constant](Context#wiki-constant).

For example, if the context step interval is five minutes, you can convert a count metric to a per-second rate by dividing by 300 (5 * 60):

```js
var requestsPerSecond = cube.metric("sum(request)").divide(5 * 60);
```

Or, more generally:

```js
var requestsPerSecond = cube.metric("sum(request)").divide(context.step() / 1000);
```

<a name="shift" href="#wiki-shift">#</a> metric.<b>shift</b>(<i>offset</i>)

Derive a new metric by time-shifting this metric by the specified <i>offset</i> in milliseconds. Unless you have a time machine, the <i>offset</i> should be negative.

For example, to compare the number of requests this week to the number of requests last week, you might say:

```js
var requestsThisWeek = cube.metric("sum(request)"),
    requestsLastWeek = requestsThisWeek.shift(-7 * 24 * 60 * 60 * 1000),
    changeInRequests = requestsThisWeek.subtract(requestsLastWeek);
```

<a name="valueAt" href="#wiki-valueAt">#</a> metric.<b>valueAt</b>(<i>index</i>)

Returns the value of the metric at the given <i>index</i>. This method is typically used only by Cubism's chart components to visualize the fetch values. The <i>index</i> is a nonnegative integer ranging from 0, indicating the context's start time (the first argument from the context's change event, inclusive), to [size](Context#wiki-size) - 1, indicate the context's stop time (the second argument, exclusive).

<a name="extent" href="#wiki-extent">#</a> metric.<b>extent</b>()

Returns the minimum and maximum metric value as a two-element array, [min, max]. This method is typically used only by Cubism's chart components to visualize the fetch values. If metric data is unavailable, returns [-Infinity, Infinity].

<a name="on" href="#wiki-on">#</a> metric.<b>on</b>(<i>type</i>[, <i>listener</i>])

Add, get or remove a listener for "change" events. This method is typically used only by other Cubism components, but can be used if you want to perform other actions concurrently when new metric values are available (such as custom processing). One type of event is currently supported:

* <b>change</b> events are dispatched at the time new metric values are available. This event is used, for example, by charts to render the new values. Listeners are passed two arguments: the <i>start</i> time (a Date, inclusive) and the <i>stop</i> time (a Date, exclusive), based on the original [context change](Context#wiki-on) event. The `this` context of the listener is the metric.

This method follows the same API as D3's [dispatch.on](/mbostock/d3/wiki/Internals#wiki-dispatch_on). If <i>listener</i> is specified and non-null, sets the callback function for events of the specified <i>type</i> and returns the metric; any existing listener for the same <i>type</i> will be replaced. If <i>listener</i> is specified and null, clears the callback function for events of the specified <i>type</i> (if any) and returns the metric. If <i>listener</i> is not specified, returns the current callback function, if any. The <i>type</i> can be further qualified with a namespace so that multiple listeners can receive the same events; for example, you might use "change.foo" and "change.bar" to register two listeners for change events.

Note: metrics only fetch new data if at least one listener is receiving change events. Typically, this is the chart visualizing the metric.

<a name="context" href="#wiki-context">#</a> metric.<b>context</b>

The metric's parent [context](Context).

<a name="toString" href="#wiki-toString">#</a> metric.<b>toString</b>()

Returns the metric's associated expression, if any. For example, for Graphite and Cube metrics this is the first argument to the constructor.