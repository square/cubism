> [Wiki](Home) ▸ [API Reference](API-Reference) ▸ <b>Cubism</b>

The Cubism namespace.

<a name="context" href="#wiki-context">#</a> cubism.<b>context</b>()

Create a new [context](Context), which specifies the resolution and duration of metrics to visualize. For example, you might say:

```js
var context = cubism.context()
    .serverDelay(30 * 1000) // allow 30 seconds of collection lag
    .step(5 * 60 * 1000) // five minutes per value
    .size(1920); // fetch 1920 values (1080p)
```

Contexts are required to create sources (so as to talk to [Cube](Cube) or [Graphite](Graphite)), which are in turn required to create [metrics](Metric). Contexts are also required to create charts (such as [horizon charts](Horizon) and [comparison charts](Comparison)). Contexts keep everything in-sync.

<a name="option" href="#wiki-option">#</a> cubism.<b>option</b>(<i>name</i>[, <i>value</i>])

Parses the query string (`location.search`), returning the value of the query parameter with the specified <i>name</i>. If no matching parameter is found, then the default <i>value</i> is returned; if no default <i>value</i> is specified, returns undefined. For example:

```js
var filter = cubism.option("filter", "hosts.foo*");
```

Given the query string "?filter=hosts.bar*", the returned value is "hosts.bar*"; however, given no query string, the default value "hosts.foo*" is returned. This method can be used to make configurable dashboards, often in conjunction with [graphite.find](Graphite#wiki-find).

<a name="options" href="#wiki-options">#</a> cubism.<b>options</b>(<i>name</i>[, <i>values</i>])

Parses the query string (`location.search`), returning the values of any query parameters with the specified <i>name</i>. If no matching parameter is found, then the default <i>values</i> are returned; if no default <i>values</i> are specified, returns the empty array. For example:

```js
var filters = cubism.options("filter", ["foo*"]);
```

Given the query string "?filter=bar\*&filter=foo\*", the returned value is ["bar\*", "foo\*"]; however, given no query string, the default value ["foo\*"] is returned. This method can be used to make configurable dashboards, often in conjunction with [graphite.find](Graphite#wiki-find).

<a name="version" href="#wiki-version">#</a> cubism.<b>version</b>

The [semantic version](http://semver.org/), which is a string of the form "X.Y.Z". <i>X</i> is the major version number, <i>Y</i> is the minor version number, and <i>Z</i> is the patch version number.