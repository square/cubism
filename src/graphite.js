cubism_context.prototype.graphite = function(host) {
  if (!arguments.length) host = "";

  var source = cubism_source(this, function(expression, start, stop, step, callback) {
    d3.text(host + "/render?format=raw"
        + "&target=" + encodeURIComponent("alias(" + expression + ",'')")
        + "&from=" + cubism_graphiteFormatDate(start - 2 * step) // off-by-two?
        + "&until=" + cubism_graphiteFormatDate(stop - 1000), function(text) {
      if (!text) return callback(new Error("unable to load data"));
      callback(null, cubism_graphiteParse(text));
    });
  });

  source.find = function(pattern, callback) {
    d3.json(host + "/metrics/find?format=completer"
        + "&query=" + encodeURIComponent(pattern), function(result) {
      if (!result) return callback(new Error("unable to find metrics"));
      callback(null, result.metrics.map(function(d) { return d.path; }));
    });
  };

  // Returns the graphite host.
  source.toString = function() {
    return host;
  };

  return source;
};

// Graphite understands seconds since UNIX epoch.
function cubism_graphiteFormatDate(time) {
  return Math.floor(time / 1000);
}

// Helper method for parsing graphite's raw format.
function cubism_graphiteParse(text) {
  var i = text.indexOf("|"),
      meta = text.substring(0, i),
      c = meta.lastIndexOf(","),
      b = meta.lastIndexOf(",", c - 1),
      a = meta.lastIndexOf(",", b - 1),
      start = meta.substring(a + 1, b) * 1000,
      step = meta.substring(c + 1) * 1000;
  return text
      .substring(i + 1)
      .split(",")
      .slice(1) // the first value is always None?
      .map(function(d) { return +d; });
}
