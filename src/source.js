function cubism_source(context, request) {
  var source = {};

  source.metric = function(expression) {
    var metric = new cubism_metric(context, expression),
        start0 = -Infinity,
        step = context.step(),
        size = context.size(),
        id = ++cubism_sourceMetricId,
        values = [],
        event = d3.dispatch("change");

    context.on("beforechange.source-metric-" + id, function(start, stop) {
      var steps = Math.min(size, Math.round((start - start0) / step));
      values.splice(0, steps);
      steps = Math.min(size, steps + cubism_sourceOverlap);
      request(expression, new Date(stop - steps * step), stop, step, function(error, data) {
        if (error) return console.warn(error);
        for (var j = 0, i = size - steps, m = data.length; j < m; ++j) values[j + i] = data[j];
        start0 = start;
        event.change.call(metric, start, stop);
      });
    });

    //
    metric.valueAt = function(i) {
      return values[i];
    };

    //
    metric.shift = function(offset) {
      return cubism_source(context, cubism_sourceShift(request, +offset)).metric(expression);
    };

    return d3.rebind(metric, event, "on");
  };

  return source;
}

// Number of metric to refetch each period, in case of lag.
var cubism_sourceOverlap = 6,
    cubism_sourceMetricId = 0;

// Wraps the specified request implementation, and shifts time by the given offset.
function cubism_sourceShift(request, offset) {
  return function(expression, start, stop, step, callback) {
    request(expression, new Date(+start + offset), new Date(+stop + offset), step, callback);
  };
}
