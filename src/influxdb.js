cubism_contextPrototype.influxdb = function(host) {
  if (!arguments.length) host = "";
  // e.g. http://{influxdb}:8086/db/test?u=name&p=password
  var source = {},
      context = this;

    // expression:
    //   .series - name of influx series
  source.metric = function(expression) {
    return context.metric(function(start, stop, step, callback) {
        var query = "&q=select+*+from+" + expression.series + "+where"
            + "+time+<+" + influxDateFormat(stop)
            + "+and+time+>+" + influxDateFormat(start)
            + "+group+by+time(" + step * 1000 + "u)";  // convert milliseconds to microseconds
        var url = host + query;

      d3.xhr(url, 'application/json', function(error, data) {
        if (!data) return callback(new Error("unable to load data"));
        callback(null, influxMetrics(data));
      });
    }, expression);
  };

  // Returns the InfluxDb host.
  source.toString = function() {
    return host;
  };

  return source;
};

function influxDateFormat(d){
    return (d.getTime() / 1000)+'s';
}

function influxMetrics(dataJson){
    var json = JSON.parse(dataJson.response);
    var metricIndex = json[0].columns.length - 1;
    return json[0].points.map(function(row){
        return row[metricIndex];
    });
}

