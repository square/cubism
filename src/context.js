cubism.context = function() {
  var context = new cubism_context,
      step, // milliseconds
      size, // number of steps
      serverDelay = 4000,
      clientDelay = 1000,
      event = d3.dispatch("beforechange", "change");

  setTimeout(function beforechange() {
    var now = Date.now(),
        stop = new Date(Math.floor((now - serverDelay - clientDelay) / step) * step),
        start = new Date(stop - size * step);
    event.beforechange.call(context, start, stop);
    setTimeout(function() { event.change.call(context, start, stop); }, clientDelay);
    setTimeout(beforechange, +stop + step + serverDelay - now);
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

  // The server delay is the amount of time we wait for the server to compute a
  // metric. This delay may result from clock skew or from delays collecting
  // metrics from various hosts. Defaults to 4 seconds.
  context.serverDelay = function(_) {
    if (!arguments.length) return serverDelay;
    serverDelay = +_;
    return context;
  };

  // The client delay is the amount of additional time we wait to fetch those
  // metrics from the server. The client and server delay combined represent the
  // age of the most recent displayed metric. Defaults to 1 second.
  context.clientDelay = function(_) {
    if (!arguments.length) return clientDelay;
    clientDelay = +_;
    return context;
  };

  // Exposes an `on` method to listen for "change" and "beforechange" events.
  d3.rebind(context, event, "on");

  return context.step(1e4).size(1440); // 4 hours at 10 seconds
};

function cubism_context() {}

cubism_context.prototype.constant = function(value) {
  return new cubism_metricConstant(this, +value);
};
