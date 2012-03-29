function cubism_source(context, request) {
  var source = {};

  source.metric = function(expression) {
    var metric = new cubism_metric,
        id = ++cubism_metricId,
        last,
        offset,
        offsetTime = context.start(),
        step = context.step(),
        size = context.size(),
        values = new Array(size),
        timeout;

    function refresh() {
      var stop = context.stop(), init;

      if (!last) last = offsetTime, init = true;
      offset = Math.round((context.start() - offsetTime) / step);

      request(expression, last, stop, step, function(error, data) {
        if (error) return console.warn(error);
        data.forEach(function(d) { values[Math.round((d[0] - offsetTime) / step) % size] = d[1]; });
        last = new Date(stop - cubism_sourceOverlap * step);
        if (init) context.refresh();
      });
    }

    // Start polling after stabilizing.
    setTimeout(refresh, 10);

    // Queue up a refresh at the first half-interval.
    var delay = context.delay() - context.step() / 2;
    if (delay > 1000) timeout = setTimeout(refresh, delay);

    // When the context changes, delay the request for a half-interval.
    context.on("change.metric-" + id, function() {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(refresh, context.step() / 2);
    });

    // When the context is closed, cancel any pending refresh.
    context.on("cancel.metric-" + id, function() {
      timeout = clearTimeout(timeout);
    });

    //
    metric.size = function() {
      return size;
    };

    //
    metric.extent = function() {
      return d3.extent(values);
    };

    //
    metric.valueAt = function(i) {
      return values[(i + offset) % size];
    };

    // Returns the associated metric expression.
    metric.toString = function() {
      return expression;
    };

    //
    metric.shift = function(from, to) {
      if (typeof from !== "function" || typeof to !== "function") {
        if (arguments.length < 2) var field = "milliseconds", value = from;
        else var field = from, value = to;
        from = cubism_shift[field](+value);
        to = cubism_shift[field](-value);
      }
      return cubism_source(context, cubism_sourceShift(request, from, to)).metric(expression);
    };

    return metric;
  };

  return source;
}

// Number of metric to refetch each period, in case of lag.
var cubism_sourceOverlap = 6;

// Wraps the specified request implementation, and shifts time by the given offset.
function cubism_sourceShift(request, from, to) {
  return function(expression, start, stop, step, callback) {
    request(expression, from(start), from(stop), step, function(error, data) {
      if (data) data = data.map(function(d) { return [to(d[0]), d[1]]; });
      callback(error, data);
    });
  };
}
