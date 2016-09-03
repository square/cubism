# Cubism.js

Cubism.js is a [D3](http://d3js.org) plugin for visualizing time series. Use Cubism to construct better realtime dashboards, pulling data from [Graphite](https://github.com/square/cubism/wiki/Graphite), [Cube](https://github.com/square/cubism/wiki/Cube) and other sources. Cubism is available under the [Apache License](LICENSE).

Want to learn more? [See the wiki.](https://github.com/square/cubism/wiki)


# OpenTSDB support

Here's a quick example of how to get it working with opentsdb:

```
<!DOCTYPE html>
<title>Network (bytes)</title>
<meta charset="utf-8">
<style>

 body {
     font-family: "Helvetica Neue", Helvetica, sans-serif;
     margin: 30px auto;
     width: 1280px;
     position: relative;
 }

 header {
     padding: 6px 0;
 }

 .group {
     margin-bottom: 1em;
 }

 .axis {
     font: 10px sans-serif;
     position: fixed;
     pointer-events: none;
     z-index: 2;
 }

 .axis text {
     -webkit-transition: fill-opacity 250ms linear;
 }

 .axis path {
     display: none;
 }

 .axis line {
     stroke: #000;
     shape-rendering: crispEdges;
 }

 .axis.top {
     background-image: linear-gradient(top, #fff 0%, rgba(255,255,255,0) 100%);
     background-image: -o-linear-gradient(top, #fff 0%, rgba(255,255,255,0) 100%);
     background-image: -moz-linear-gradient(top, #fff 0%, rgba(255,255,255,0) 100%);
     background-image: -webkit-linear-gradient(top, #fff 0%, rgba(255,255,255,0) 100%);
     background-image: -ms-linear-gradient(top, #fff 0%, rgba(255,255,255,0) 100%);
     top: 0px;
     padding: 0 0 24px 0;
 }

 .axis.bottom {
     background-image: linear-gradient(bottom, #fff 0%, rgba(255,255,255,0) 100%);
     background-image: -o-linear-gradient(bottom, #fff 0%, rgba(255,255,255,0) 100%);
     background-image: -moz-linear-gradient(bottom, #fff 0%, rgba(255,255,255,0) 100%);
     background-image: -webkit-linear-gradient(bottom, #fff 0%, rgba(255,255,255,0) 100%);
     background-image: -ms-linear-gradient(bottom, #fff 0%, rgba(255,255,255,0) 100%);
     bottom: 0px;
     padding: 24px 0 0 0;
 }

 .horizon {
     border-bottom: solid 1px #000;
     overflow: hidden;
     position: relative;
 }

 .horizon {
     border-top: solid 1px #000;
     border-bottom: solid 1px #000;
 }

 .horizon + .horizon {
     border-top: none;
 }

 .horizon canvas {
     display: block;
 }

 .horizon .title,
 .horizon .value {
     bottom: 0;
     line-height: 30px;
     margin: 0 6px;
     position: absolute;
     text-shadow: 0 1px 0 rgba(255,255,255,.5);
     white-space: nowrap;
 }

 .horizon .title {
     left: 0;
 }

 .horizon .value {
     right: 0;
 }

 .line {
     background: #000;
     z-index: 2;
 }
 <!DOCTYPE html>
 <meta charset="utf-8">
 <style>

 body {
     font-family: "Helvetica Neue", Helvetica, sans-serif;
     margin: 30px auto;
     width: 1280px;
     position: relative;
 }

 header {
     padding: 6px 0;
 }

 .group {
     margin-bottom: 1em;
 }

 .axis {
     font: 10px sans-serif;
     position: fixed;
     pointer-events: none;
     z-index: 2;
 }

 .axis text {
     -webkit-transition: fill-opacity 250ms linear;
 }

 .axis path {
     display: none;
 }

 .axis line {
     stroke: #000;
     shape-rendering: crispEdges;
 }

 .axis.top {
     background-image: linear-gradient(top, #fff 0%, rgba(255,255,255,0) 100%);
     background-image: -o-linear-gradient(top, #fff 0%, rgba(255,255,255,0) 100%);
     background-image: -moz-linear-gradient(top, #fff 0%, rgba(255,255,255,0) 100%);
     background-image: -webkit-linear-gradient(top, #fff 0%, rgba(255,255,255,0) 100%);
     background-image: -ms-linear-gradient(top, #fff 0%, rgba(255,255,255,0) 100%);
     top: 0px;
     padding: 0 0 24px 0;
 }

 .axis.bottom {
     background-image: linear-gradient(bottom, #fff 0%, rgba(255,255,255,0) 100%);
     background-image: -o-linear-gradient(bottom, #fff 0%, rgba(255,255,255,0) 100%);
     background-image: -moz-linear-gradient(bottom, #fff 0%, rgba(255,255,255,0) 100%);
     background-image: -webkit-linear-gradient(bottom, #fff 0%, rgba(255,255,255,0) 100%);
     background-image: -ms-linear-gradient(bottom, #fff 0%, rgba(255,255,255,0) 100%);
     bottom: 0px;
     padding: 24px 0 0 0;
 }

 .horizon {
     border-bottom: solid 1px #000;
     overflow: hidden;
     position: relative;
 }

 .horizon {
     border-top: solid 1px #000;
     border-bottom: solid 1px #000;
 }

 .horizon + .horizon {
     border-top: none;
 }

 .horizon canvas {
     display: block;
 }

 .horizon .title,
 .horizon .value {
     bottom: 0;
     line-height: 30px;
     margin: 0 6px;
     position: absolute;
     text-shadow: 0 1px 0 rgba(255,255,255,.5);
     white-space: nowrap;
 }

 .horizon .title {
     left: 0;
 }

 .horizon .value {
     right: 0;
 }

 .line {
     background: #000;
     z-index: 2;
 }


</style>

<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js" charset="utf-8"></script>
<script src="/s/cubism.v1.js"></script>
<script>
     var context = cubism.context().step(60000).size(1280).serverDelay(15000);
     var opentsdb = context.opentsdb({"url":'http://10.0.3.10:4242/api/query'});
     var servers = [
         'server-01',
         'server-02'
     ];
     var load_metrics = [];
     servers.forEach(function(server) {
         load_metrics.push(opentsdb.metric({
             'hostName': server,
             'metricName': 'os.net.bytes',
             'rate': true,
             'tags': ',direction=in'
         }).alias(server + '-in'));
         load_metrics.push(opentsdb.metric({
             'hostName': server,
             'metricName': 'os.net.bytes',
             'rate': true,
             'tags': ',direction=out'
         }).multiply(-1).alias(server + '-out'));
     });

 d3.select("#demo").selectAll(".axis")
       .data(["top", "bottom"])
       .enter().append("div")
       .attr("class", function(d) { return d + " axis"; })
       .each(function(d) { d3.select(this).call(context.axis().ticks(12).orient(d)); });

     d3.select("body").append("div")
       .attr("class", "rule")
       .call(context.rule());

     d3.select("body").selectAll(".horizon")
       .data(load_metrics)
       .enter().insert("div", ".bottom")
       .attr("class", "horizon")
       .call(context.horizon().extent([0, 100e5]).height(40));

     context.on("focus", function(i) {
         d3.selectAll(".value").style("right", i == null ? null : context.size() - i + "px");
     });
</script>
```