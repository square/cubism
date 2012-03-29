function cubism_source(context, request) {
  var source = {};

  source.metric = function(expression) {
    var metric = [],
        last,
        reference,
        timeout;

    function refresh() {
      var step = context.step(),
          stop = context.stop(),
          size = context.size();

      if (!last) last = reference = context.start();

      request(expression, last, stop, step, function(error, data) {
        if (error) return console.warn(error);
        data.forEach(function(d) { metric[Math.round((d[0] - reference) / step) % size] = d; });
        last = new Date(stop - cubism_sourceOverlap * step);
      });
    }

    // Start polling after stabilizing.
    setTimeout(refresh, 10);

    // When the context changes, delay the request for a half-interval.
    context.on("change", function() {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(refresh, context.step() / 2);
    });

    // When the context is closed, cancel any pending refresh.
    context.on("cancel", function() {
      timeout = clearTimeout(timeout);
    });

    metric.expression = function() {
      return expression;
    };

    return metric;
  };

  return source;
}

// Number of metric to refetch each period, in case of lag.
var cubism_sourceOverlap = 6;
