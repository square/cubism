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
    timeout = setTimeout(change, +stop + step - Date.now());
  }

  function rescale() {
    var now = Date.now();
    stop = new Date(Math.floor(now / step) * step);
    start = new Date(stop - size * step);
    return context;
  }

  context.start = function() {
    return start;
  };

  context.stop = function() {
    return stop;
  };

  context.step = function(_) {
    if (!arguments.length) return step;
    if (timeout) throw new Error("step cannot be changed mid-flight");
    step = +_;
    return rescale();
  };

  context.size = function(_) {
    if (!arguments.length) return size;
    if (timeout) throw new Error("size cannot be changed mid-flight");
    size = +_;
    return rescale();
  };

  context.cancel = function() {
    if (timeout) {
      timeout = clearTimeout(timeout);
      event.cancel.call(context);
    }
    return context;
  };

  d3.rebind(context, event, "on");

  return context.step(1e4).size(1440); // 4 hours at 10 seconds
};

function cubism_context() {}
