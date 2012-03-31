cubism.context = function() {
  var context = new cubism_context,
      step, // milliseconds
      size, // number of steps
      event = d3.dispatch("beforechange", "change");

  setTimeout(function beforechange() {
    var now = Date.now(),
        stop = new Date(Math.floor((now - cubism_contextDelay) / step + 1) * step),
        start = new Date(stop - size * step);
    event.beforechange.call(context, start, stop);
    setTimeout(function() { event.change.call(context, start, stop); }, cubism_contextClientDelay);
    setTimeout(beforechange, +stop + step + cubism_contextServerDelay - now);
  }, 10);

  // Set or get the step interval in milliseconds.
  // Defaults to ten seconds.
  context.step = function(_) {
    if (!arguments.length) return step;
    step = +_;
    return context;
  };

  // Set or get the context size (the count of metric values).
  // Defaults to 1440 (four hours at ten seconds).
  context.size = function(_) {
    if (!arguments.length) return size;
    size = +_;
    return context;
  };

  // Exposes an `on` method to listen for "change" and "beforechange" events.
  d3.rebind(context, event, "on");

  return context.step(1e4).size(1440); // 4 hours at 10 seconds
};

// The server delay is the amount of time we wait for the server to compute a
// metric. This delay may result from clock skew or from delays collecting
// metrics from various hosts. The client delay is the amount of additional time
// we wait to fetch those metrics from the server. These delays added together
// represent the age of the most recent displayed metric.
var cubism_contextServerDelay = 4000,
    cubism_contextClientDelay = 1000,
    cubism_contextDelay = cubism_contextServerDelay + cubism_contextClientDelay;

function cubism_context() {}

cubism_context.prototype.constant = function(value) {
  return new cubism_metricConstant(this, +value);
};
