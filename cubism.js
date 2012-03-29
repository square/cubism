(function(exports){
var cubism = exports.cubism = {version: "0.0.1"};
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
cubism_context.prototype.cube = function(host) {
  var source = cubism_source(this, request),
      iso = d3.time.format.iso;

  if (!arguments.length) host = "";

  source.host = function() {
    return host;
  };

  function request(expression, start, stop, step, callback) {
    d3.json(host + "/1.0/metric"
        + "?expression=" + encodeURIComponent(expression)
        + "&start=" + iso(start)
        + "&stop=" + iso(stop)
        + "&step=" + step, function(data) {
      if (!data) return callback(new Error("unable to load data"));
      callback(null, data.map(function(d) { return [iso.parse(d.time), d.value]; }));
    });
  }

  return source;
};
cubism_context.prototype.graphite = function(host) {
  var source = cubism_source(this, request);

  if (!arguments.length) host = "";

  source.host = function() {
    return host;
  };

  function request(expression, start, stop, step, callback) {
    d3.text(host + "/render?format=raw"
        + "&target=" + encodeURIComponent("alias(" + expression + ",'')")
        + "&from=" + cubism_graphiteFormatDate(start - 2 * step)
        + "&until=" + cubism_graphiteFormatDate(stop - 1000), function(text) {
      if (!text) return callback(new Error("unable to load data"));
      callback(null, cubism_graphiteParse(text));
    });
  }

  return source;
};

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
})(this);
