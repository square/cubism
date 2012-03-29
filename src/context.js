cubism.context = function() {
  var context = new cubism_context,
      start = new Date(NaN),
      stop = new Date(NaN),
      step, // milliseconds
      size, // number of steps
      event = d3.dispatch("change", "cancel"),
      timeout;

  setTimeout(rechange, 10);

  function change() {
    rescale();
    event.change.call(context);
    rechange();
  }

  function rechange() {
    timeout = setTimeout(change, context.delay());
  }

  function rescale() {
    var now = Date.now();
    stop = new Date(Math.floor(now / step) * step);
    start = new Date(stop - size * step);
    return context;
  }

  // Returns the start time of the context (inclusive).
  context.start = function() {
    return start;
  };

  // Returns the stop time of the context (exclusive).
  context.stop = function() {
    return stop;
  };

  // Returns the delay in milliseconds until the next change.
  context.delay = function() {
    return +stop + step - Date.now();
  };

  // Set or get the step interval in milliseconds.
  // The step interval cannot be changed after the context is started.
  // Defaults to 10 seconds.
  context.step = function(_) {
    if (!arguments.length) return step;
    if (timeout) throw new Error("step cannot be changed mid-flight");
    step = +_;
    return rescale();
  };

  // Set or get the context size (the count of metric values).
  // The size cannot be changed after the context is started.
  // Defaults to 1440 (4 hours at 10 seconds).
  context.size = function(_) {
    if (!arguments.length) return size;
    if (timeout) throw new Error("size cannot be changed mid-flight");
    size = +_;
    return rescale();
  };

  // Disposes this context, cancelling any subsequent updates.
  context.cancel = function() {
    if (timeout) {
      timeout = clearTimeout(timeout);
      event.cancel.call(context);
    }
    return context;
  };

  // Returns the time at the specified index `i`.
  // If `i` is zero, this is equivalent to start.
  // If `i` is size, this is equivalent to stop.
  context.timeAt = function(i) {
    return new Date(+start + i * step);
  };

  // Exposes an `on` method to listen for "change" and "cancel" events.
  d3.rebind(context, event, "on");

  return context.step(1e4).size(1440); // 4 hours at 10 seconds
};

function cubism_context() {}

cubism_context.prototype.constant = function(value) {
  return cubism_contextConstant(this.size(), value);
};

function cubism_contextConstant(size, value) {
  value = +value, size = +size;
  var metric = new cubism_metric;
  metric.extent = function() { return [value, value]; };
  metric.valueAt = function() { return value; };
  metric.toString = function() { return value + ""; };
  metric.size = function() { return size; };
  return metric;
}
