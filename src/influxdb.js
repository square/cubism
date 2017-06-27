cubism_contextPrototype.influxdb = function(host, database) {
  if (!arguments.length) host = "";
  // e.g. http://influxdb:8086/, cubism
  var source = {},
    context = this;

  // expression:
  //   .select - data to select
  //   .from   - name of influx series
  //   .where  - array of where clauses
  // example: metric({select: "sum(requests)", from: "myapp", where: ["host='host-1'"]})
  source.metric = function(expression) {
    return context.metric(function(start, stop, step, callback) {
      var influxQuery = buildInfluxQuery(expression.select, expression.from, expression.where, start, stop, step);
      var urlquery = `query?q=${encodeURIComponent(influxQuery)}&db=${database}`;
      var url = host + urlquery;

      d3.xhr(url, 'application/json', function(error, data) {
        if (!data) return callback(new Error("unable to load data"));
        callback(null, influxMetrics(data, expression.column));
      });
    }, expression);
  };

  // Returns the InfluxDb host.
  source.toString = function() {
    return host;
  };

  return source;
};

function buildInfluxQuery(select, from, where, start, stop, step) {
  where = (where === undefined) ? [] : JSON.parse(JSON.stringify(where));
  where.push(`time < ${influxDateFormat(stop)} AND time > ${influxDateFormat(start)}`)

  return `SELECT ${select} ` +
    `FROM ${from} ` +
    `WHERE ${where.join(" AND ")} ` +
    `GROUP BY time(${step*1000}u) ` +
    `FILL(0)`;
};

function influxDateFormat(d) {
  return (d.getTime() / 1000) + 's';
};

function influxMetrics(dataJson, column) {
  var json = JSON.parse(dataJson.response);
  if (json.results[0].series === undefined) {
    return []
  };

  var metricIndex = json.results[0].series[0].columns.indexOf(column);
  if (metricIndex < 0) {
    metricIndex = json.results[0].series[0].columns.length - 1;
  }
  return json.results[0].series[0].values.map(function(row) {
    return row[metricIndex];
  });
};
