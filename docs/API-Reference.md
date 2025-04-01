> [Wiki](Home) ▸ <b>API Reference</b>

Everything in Cubism is scoped under the `cubism` namespace. To get started, see [cubism.context](Cubism#wiki-context).

## [cubism](Cubism)

* [cubism.context](Cubism#wiki-context) - create a new context.
* [cubism.option](Cubism#wiki-option) - parse the query string for an optional parameter.
* [cubism.options](Cubism#wiki-options) - parse the query string for optional parameters.
* [cubism.version](Cubism#wiki-version) - determine the current semantic version number.

## [context](Context)

* [context.step](Context#wiki-step) - get or set the context step in milliseconds.
* [context.size](Context#wiki-size) - get or set the context size in number of values.
* [context.serverDelay](Context#wiki-serverDelay) - get or set the context server-side delay in milliseconds.
* [context.clientDelay](Context#wiki-clientDelay) - get or set the context client-side delay in milliseconds.
* [context.on](Context#wiki-on) - add, get or remove a listener for context events.
* [context.graphite](Context#wiki-graphite) - create a source for Graphite metrics.
* [context.cube](Context#wiki-cube) - create a source for Cube metrics.
* [context.librato](Context#wiki-librato) - create a source for Librato metrics.
* [context.constant](Context#wiki-constant) - create a constant-value metric.
* [context.horizon](Context#wiki-horizon) - create a horizon chart.
* [context.comparison](Context#wiki-comparison) - create a comparison chart.
* [context.axis](Context#wiki-axis) - create an axis.
* [context.rule](Context#wiki-rule) - create a rule.
* [context.focus](Context#wiki-focus) - focus the specified index (for mousemove interaction).
* [context.scale](Context#wiki-scale) - get the <i>x</i>-scale.
* [context.stop](Context#wiki-stop) - stop the context, pausing any events.
* [context.start](Context#wiki-start) - restart the context.
* [context.metric](Context#wiki-metric) - define a new metric implementation.

## [ganglia](Ganglia)

* [gangliaWeb.metric](Ganglia#wiki-metric) - create a Ganglia metric.
* [gangliaWeb.toString](Ganglia#wiki-metric) - returns title of the metric.

## [graphite](Graphite)

* [graphite.metric](Graphite#wiki-metric) - create a Graphite metric.
* [graphite.find](Graphite#wiki-find) - query the Graphite server to find metrics.
* [graphite.toString](Graphite#wiki-toString) - get the Graphite host URL.

## [cube](Cube)

* [cube.metric](Cube#wiki-metric) - create a Cube metric.
* [cube.toString](Cube#wiki-toString) - get the Cube host URL.

## [librato](Librato)

* [librato.metric](Librato#wiki-metric) - create a Librato metric.

## [metric](Metric)

* [metric.valueAt](Metric#wiki-valueAt) - get the value of the metric at the given index.
* [metric.extent](Metric#wiki-extent) - get the minimum and maximum metric value.
* [metric.add](Metric#wiki-add) - add another metric or constant to this metric.
* [metric.subtract](Metric#wiki-subtract) - subtract another metric or constant from this metric.
* [metric.multiply](Metric#wiki-multiply) - multiply this metric by another metric or constant.
* [metric.divide](Metric#wiki-divide) - divide this metric by another metric or constant.
* [metric.shift](Metric#wiki-shift) - time-shift this metric.
* [metric.on](Metric#wiki-on) - add, get or remove a listener for "change" events.
* [metric.context](Metric#wiki-context) - get the metric's parent context.
* [metric.toString](Metric#wiki-toString) - get the metric's associated expression, if any.

## [horizon](Horizon)

* [horizon](Horizon#wiki-_horizon) - apply the horizon chart to a D3 selection.
* [horizon.mode](Horizon#wiki-mode) - get or set the horizon mode ("offset" or "mirror").
* [horizon.height](Horizon#wiki-height) - get or set the chart height in pixels.
* [horizon.metric](Horizon#wiki-metric) - get or set the chart metric.
* [horizon.scale](Horizon#wiki-scale) - get or set the y-scale.
* [horizon.extent](Horizon#wiki-extent) - get or set the chart extent (if not automatic).
* [horizon.title](Horizon#wiki-title) - get or set the chart title.
* [horizon.format](Horizon#wiki-format) - get or set the chart's value format function.
* [horizon.colors](Horizon#wiki-colors) - get or set the horizon layer colors.
* [horizon.remove](Horizon#wiki-remove) - remove the horizon chart from a D3 selection.

## [comparison](Comparison)

* [comparison](Comparison#wiki-_comparison) - apply the comparison chart to a D3 selection.
* [comparison.height](Comparison#wiki-height) - get or set the chart height in pixels.
* [comparison.primary](Comparison#wiki-primary) - get or set the primary metric.
* [comparison.secondary](Comparison#wiki-secondary) - get or set the comparison metric.
* [comparison.scale](Comparison#wiki-scale) - get or set the y-scale.
* [comparison.extent](Comparison#wiki-extent) - get or set the chart extent (if not automatic).
* [comparison.title](Comparison#wiki-title) - get or set the chart title.
* [comparison.formatPrimary](Comparison#wiki-formatPrimary) - get or set the primary value format function.
* [comparison.formatChange](Comparison#wiki-formatChange) - get or set the percentage change format function.
* [comparison.colors](Comparison#wiki-colors) - get or set the comparison colors (positive and negative).
* [comparison.stroke](Comparison#wiki-stroke) - get or set the primary metric's stroke color.
* [comparison.strokeWidth](Comparison#wiki-strokeWidth) - get or set the primary metric's stroke width.
* [comparison.fill](Comparison#wiki-fill) - get or set the primary metric's fill color.
* [comparison.remove](Comparison#wiki-remove) - remove the chart from a D3 selection.

## [axis](Axis)

* [axis](Axis#wiki-_axis) - apply an axis generator to a D3 selection.
* [axis.orient](Axis#wiki-orient) - get or set the axis orientation.
* [axis.ticks](Axis#wiki-ticks) - control how ticks are generated for the axis.
* [axis.tickSubdivide](Axis#wiki-tickSubdivide) - optionally subdivide ticks uniformly.
* [axis.tickSize](Axis#wiki-tickSize) - specify the size of major, minor and end ticks.
* [axis.tickPadding](Axis#wiki-tickPadding) - specify padding between ticks and tick labels.
* [axis.tickFormat](Axis#wiki-tickFormat) - override the tick formatting for labels.
* [axis.remove](Axis#wiki-remove) - remove the axis from a D3 selection.

## [rule](Rule)

* [rule](Rule#wiki-_rule) - apply a rule generator to a D3 selection.
* [rule.metric](Rule#wiki-metric) - generate rules at each non-zero value for the given metric.
* [rule.remove](Rule#wiki-remove) - remove the rule from a D3 selection.