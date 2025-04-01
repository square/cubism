> [Wiki](Home) ▸ [API Reference](API-Reference) ▸ <b>Ganglia</b>

A source for [Ganglia](http://ganglia.info/) metrics. To create a source, first create a [context](Context). Then, use [context.graphite](Context#wiki-ganglia) to specify the URL and path to the Ganglia Web installation server. :

```js
var context = cubism.context()
    .serverDelay(15 * 1000) // allow 15 seconds of collection lag
    .step(15000) // fifteen seconds per value
    .size(1440); // fetch 1440 values (720p)
var ganglia = context.gangliaWeb( {"host": 'https://ganglia.domain.com', "uriPathPrefix": '/ganglia/'} );
```
After you create the context add some metrics e.g.

<a name="metric" href="#wiki-metric">#</a> gangliaWeb.<b>metric</b>

Creates a new [metric](Metric) for a given Ganglia metric you need to specify clusterName, hostName, metricName and whether it's a report (boolean)

```js
var load_metrics = [
ganglia.metric( { "clusterName": "MYCLUSTE", "hostName": "web1", "metricName": "load_one", "isReport": false} ).alias("web load"),
ganglia.metric( { "clusterName": "MYCLUSTE", "hostName": "web2", "metricName": "load_one", "isReport": false} ).alias("web load")
];
```

After that you just need to add some colors to use and append the metrics into the DOM

```js
var horizon = context.horizon().colors(["#08519c", "#*82bd", "#6baed6", "#fee6ce", "#fdae6b", "#e6550d" ]);
d3.select("body").selectAll(".axis")
    .data(["top", "bottom"])
  .enter().append("div").attr("class", "fluid-row")
    .attr("class", function(d) { return d + " axis"; })
    .each(function(d) { d3.select(this).call(context.axis().ticks(12).orient(d)); });
d3.select("body").append("div")
    .attr("class", "rule")
    .call(context.rule());
d3.select("body").selectAll(".horizon")
    .data(load_metrics)
  .enter().insert("div", ".bottom")
    .attr("class", "horizon").call(horizon.extent([0, 32]));
context.on("focus", function(i) {
  d3.selectAll(".value").style("right", i == null ? null : context.size() - 1 - i + "px");
});
```

Please note the **horizon.extent([0, 32])**. Those are minimum and maximum values for your metric. Choose those carefully.

<a name="toString" href="#wiki-toString">#</a> gangliaWeb.<b>toString</b>()

Returns the title of the Ganglia metric [constructor](#wiki-ganglia).