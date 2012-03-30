(function(exports){
var cubism = exports.cubism = {version: "0.0.1"};
function cubism_identity(d) { return d; }
var cubism_shift = {
  milliseconds: function(v) { v = +v; return function(d) { return new Date(+d + v); }; },
  second: function(v) { v *= 1e3; return function(d) { return new Date(+d + v); }; },
  minute: function(v) { v *= 6e4; return function(d) { return new Date(+d + v); }; },
  hour: function(v) { v = +v; return function(d) { d = new Date(+d); d.setHours(d.getHours() + v); return d; }; },
  day: function(v) { v = +v; return function(d) { d = new Date(+d); d.setDate(d.getDate() + v); return d; }; },
  month: function(v) { v = +v; return function(d) { d = new Date(+d); d.setMonths(d.getMonths() + v); return d; }; },
  year: function(v) { v = +v; return function(d) { d = new Date(+d); d.setFullYear(d.getFullYear() + v); return d; }; }
};
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
function cubism_metric() {}

var cubism_metricId = 0;

cubism_metric.prototype.add = cubism_metricComposer("+", function(a, b) { return a + b; });
cubism_metric.prototype.subtract = cubism_metricComposer("-", function(a, b) { return a - b; });
cubism_metric.prototype.multiply = cubism_metricComposer("*", function(a, b) { return a * b; });
cubism_metric.prototype.divide = cubism_metricComposer("/", function(a, b) { return a / b; });

function cubism_metricComposer(name, operator) {
  return function compose(b) {
    var a = this;
    if (!(b instanceof cubism_metric)) b = cubism_contextConstant(a.size(), b);
    if (a.size() !== b.size()) throw new Error("different size!");
    var metric = new cubism_metric;
    metric.extent = function() { return d3.extent(d3.range(a.size()), metric.valueAt); };
    metric.valueAt = function(i) { return operator(a.valueAt(i), b.valueAt(i)); };
    metric.toString = function() { return a + " " + name + " " + b; };
    metric.size = a.size;
    metric.shift = function() { return compose.call(a.shift.apply(a, arguments), b.shift.apply(b, arguments)); };
    return metric;
  };
}
cubism_context.prototype.cube = function(host) {
  if (!arguments.length) host = "";

  var source = cubism_source(this, function(expression, start, stop, step, callback) {
    d3.json(host + "/1.0/metric"
        + "?expression=" + encodeURIComponent(expression)
        + "&start=" + cubism_cubeFormatDate(start)
        + "&stop=" + cubism_cubeFormatDate(stop)
        + "&step=" + step, function(data) {
      if (!data) return callback(new Error("unable to load data"));
      callback(null, data.map(function(d) { return [cubism_cubeParseDate(d.time), d.value]; }));
    });
  });

  // Returns the Cube host.
  source.toString = function() {
    return host;
  };

  return source;
};

var cubism_cubeFormatDate = d3.time.format.iso,
    cubism_cubeParseDate = cubism_cubeFormatDate.parse;
cubism_context.prototype.graphite = function(host) {
  if (!arguments.length) host = "";

  var source = cubism_source(this, function(expression, start, stop, step, callback) {
    d3.text(host + "/render?format=raw"
        + "&target=" + encodeURIComponent("alias(" + expression + ",'')")
        + "&from=" + cubism_graphiteFormatDate(start - 2 * step)
        + "&until=" + cubism_graphiteFormatDate(stop - 1000), function(text) {
      if (!text) return callback(new Error("unable to load data"));
      callback(null, cubism_graphiteParse(text));
    });
  });

  // Returns the graphite host.
  source.toString = function() {
    return host;
  };

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
      timeout,
      refreshTimeout;

  setTimeout(rechange, 10);

  function change() {
    refresh();
    rechange();
  }

  function refresh() {
    refreshTimeout = 0;
    rescale();
    event.change.call(context);
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

  // Hasten the next change event, accumulating concurrent updates.
  // This is typically used only by metrics when new data is available.
  context.refresh = function() {
    if (timeout && !refreshTimeout) refreshTimeout = setTimeout(refresh, 250);
    return context;
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
  metric.shift = function() { return metric; };
  return metric;
}
cubism_context.prototype.horizon = function() {
  var mode = "offset",
      width = this.size(),
      height = 40,
      metric = cubism_identity,
      extent = null,
      title = cubism_identity,
      format = d3.format(".2s");

  // TODO configurable positive colors
  // TODO configurable negative colors
  // TODO configurable bands

  function horizon(selection) {
    selection.each(function(d, i) {
      var div = d3.select(this),
          canvas = div.select("canvas"),
          tspan = div.select(".title"),
          vspan = div.select(".value"),
          metric_ = typeof metric === "function" ? metric.call(this, d, i) : metric,
          extent_ = typeof extent === "function" ? extent.call(this, d, i) : extent,
          title_ = typeof title === "function" ? title.call(this, d, i) : title;

      if (canvas.empty()) {
        canvas = div.append("canvas").attr("width", width).attr("height", height);
        tspan = div.append("span").attr("class", "title");
        vspan = div.append("span").attr("class", "value");
      }

      if (extent_ == null) extent_ = metric_.extent();

      var y = d3.scale.linear()
          .domain([0, Math.max(-extent_[0], extent_[1])])
          .rangeRound([height, 0]);

      var context = canvas.node().getContext("2d");
      context.clearRect(0, 0, width, height);

      context.fillStyle = "steelblue";
      for (var i = 0, n = width, v; i < n; ++i) {
        var v = metric_.valueAt(i);
        if (v <= 0) continue;
        context.fillRect(i, v = y(v), 1, height - v);
      }

      context.fillStyle = "brown";
      if (mode == "offset") {
        for (var i = 0, n = width, v; i < n; ++i) {
          var v = metric_.valueAt(i);
          if (v >= 0) continue;
          context.fillRect(i, 0, 1, height - y(-v));
        }
      } else {
        for (var i = 0, n = width, v; i < n; ++i) {
          var v = metric_.valueAt(i);
          if (v >= 0) continue;
          context.fillRect(i, v = y(-v), 1, height - v);
        }
      }

      tspan.text(title_);
      vspan.datum(v).text(isNaN(v) ? null : format);
    });
  }

  horizon.mode = function(_) {
    if (!arguments.length) return mode;
    mode = _ + "";
    return horizon;
  };

  horizon.height = function(_) {
    if (!arguments.length) return height;
    height = +_;
    return horizon;
  };

  horizon.metric = function(_) {
    if (!arguments.length) return metric;
    metric = _;
    return horizon;
  };

  horizon.extent = function(_) {
    if (!arguments.length) return extent;
    extent = _;
    return horizon;
  };

  horizon.title = function(_) {
    if (!arguments.length) return title;
    title = _;
    return horizon;
  };

  horizon.format = function(_) {
    if (!arguments.length) return format;
    format = _;
    return horizon;
  };

  return horizon;
};
})(this);
