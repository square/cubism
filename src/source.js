function cubism_source(context, request) {
  var source = {};

  source.metric = function(expression) {
    var metric = new cubism_metric(context, expression),
        id = ".source-metric-" + ++cubism_id,
        start = -Infinity,
        step = context.step(),
        size = context.size(),
        values = [],
        event = d3.dispatch("change"),
        listening = 0,
        fetching;

    // Prefetch new data into a temporary array.
    function prepare(start1, stop) {
      var steps = Math.min(size, Math.round((start1 - start) / step));
      if (!steps || fetching) return; // already fetched, or fetching!
      fetching = true;
      steps = Math.min(size, steps + cubism_sourceOverlap);
      var start0 = new Date(stop - steps * step);
      request(expression, start0, stop, step, function(error, data) {
        fetching = false;
        if (error) return console.warn(error);
        var i = Math.round((start0 - start) / step);
        for (var j = 0, m = data.length; j < m; ++j) values[j + i] = data[j];
        event.change.call(metric, start, stop);
      });
    }

    // When the context changes, switch to the new data, ready-or-not!
    function beforechange(start1, stop) {
      values.splice(0, Math.max(0, Math.min(size, Math.round((start1 - start) / step))));
      start = start1;
    }

    //
    metric.valueAt = function(i) {
      return values[i];
    };

    //
    metric.shift = function(offset) {
      return cubism_source(context, cubism_sourceShift(request, +offset)).metric(expression);
    };

    //
    metric.on = function(type, listener) {
      if (!arguments.length) return event.on(type);
      if (listener == null && event.on(type) != null) --listening;
      if (listener != null && event.on(type) == null) ++listening;
      context.on("prepare" + id, listening > 0 ? prepare : null);
      context.on("beforechange" + id, listening > 0 ? beforechange : null);
      event.on(type, listener);
      return metric;
    };

    return metric;
  };

  return source;
}

// Number of metric to refetch each period, in case of lag.
var cubism_sourceOverlap = 6;

// Wraps the specified request implementation, and shifts time by the given offset.
function cubism_sourceShift(request, offset) {
  return function(expression, start, stop, step, callback) {
    request(expression, new Date(+start + offset), new Date(+stop + offset), step, callback);
  };
}
