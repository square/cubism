function cubism_source(request) {
  var source = {};

  source.metric = function(context, expression) {
    var last,
        offset,
        offsetTime = context.start(),
        step = context.step(),
        size = context.size(),
        metric = new Array(size),
        timeout;

    function refresh() {
      var stop = context.stop();

      if (!last) last = offsetTime;
      offset = Math.round((context.start() - offsetTime) / step);

      request(expression, last, stop, step, function(error, data) {
        if (error) return console.warn(error);
        data.forEach(function(d) { metric[Math.round((d[0] - offsetTime) / step) % size] = d[1]; });
        last = new Date(stop - cubism_sourceOverlap * step);
      });
    }

    // Start polling after stabilizing.
    setTimeout(refresh, 10);

    // Queue up a refresh at the first half-interval.
    var delay = context.delay() - context.step() / 2;
    if (delay > 1000) timeout = setTimeout(refresh, delay);

    // When the context changes, delay the request for a half-interval.
    context.on("change", function() {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(refresh, context.step() / 2);
    });

    // When the context is closed, cancel any pending refresh.
    context.on("cancel", function() {
      timeout = clearTimeout(timeout);
    });

    //
    metric.valueAt = function(i) {
      return metric[(i + offset) % size];
    };

    // Returns the associated metric expression.
    metric.toString = function() {
      return expression;
    };

    return metric;
  };

  return source;
}

// Number of metric to refetch each period, in case of lag.
var cubism_sourceOverlap = 6;
