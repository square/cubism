cubism_context.prototype.graphite = function(host) {
  return new cubism_graphite(this, arguments.length ? host : "");
};

function cubism_graphite(context, host) {
  var graphite = {};

  graphite.host = function() {
    return host;
  };

  graphite.metric = function(expression) {
    var metric = [],
        event = d3.dispatch("change"),
        last,
        reference,
        overlap = 6,
        timeout;

    // Start polling after stabilizing.
    setTimeout(refresh, 10);

    function refresh() {
      var start = context.start(),
          stop = context.stop(),
          step = context.step(),
          size = context.size();

      if (!last) last = reference = start;

      d3.text(host + "/render?format=raw"
          + "&target=" + encodeURIComponent("alias(" + expression + ",'')")
          + "&from=" + cubism_graphiteFormatDate(last - 2 * step)
          + "&until=" + cubism_graphiteFormatDate(stop - 1000), function(text) {
        if (text) {
          var data = cubism_graphiteParse(text);
          data.forEach(function(d) { metric[Math.round((d[0] - reference) / step) % size] = d; });
          last = new Date(stop - overlap * step);
          event.change.call(metric, data);
        }
      });
    }

    // When the context changes, delay the request for a half-interval.
    context.on("change", function() {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(refresh, context.step() / 2);
    });

    metric.expression = function() {
      return expression;
    };

    d3.rebind(metric, event, "on");

    return metric;
  };

  return graphite;
}

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
      .map(function(d, i) { return [new Date(start + i * step), +d]; })
      .slice(1); // the first value is always None?
}
