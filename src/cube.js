cubism_context.prototype.cube = function(host) {
  var source = cubism_source(this, request),
      iso = d3.time.format.iso;

  if (!arguments.length) host = "";

  // Returns the Cube host.
  source.toString = function() {
    return host;
  };

  function request(expression, start, stop, step, callback) {
    d3.json(host + "/1.0/metric"
        + "?expression=" + encodeURIComponent(expression)
        + "&start=" + iso(start)
        + "&stop=" + iso(stop)
        + "&step=" + step, function(data) {
      if (!data) return callback(new Error("unable to load data"));
      callback(null, data.map(function(d) { return [iso.parse(d.time), d.value]; }));
    });
  }

  return source;
};
