(function(exports){
var cubism = exports.cubism = {version: "0.0.1"};
function cubism_identity(d) { return d; }
function cubism_source(request) {
  var source = {};

  source.metric = function(context, expression) {
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
      var stop = context.stop();

      if (!last) last = offsetTime;
      offset = Math.round((context.start() - offsetTime) / step);

      request(expression, last, stop, step, function(error, data) {
        if (error) return console.warn(error);
        data.forEach(function(d) { values[Math.round((d[0] - offsetTime) / step) % size] = d[1]; });
        last = new Date(stop - cubism_sourceOverlap * step);
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

    return metric;
  };

  return source;
}

// Number of metric to refetch each period, in case of lag.
var cubism_sourceOverlap = 6;
function cubism_metric() {}

var cubism_metricId = 0;
cubism.cube = function(host) {
  if (!arguments.length) host = "";
  var iso = d3.time.format.iso;

  var source = cubism_source(function(expression, start, stop, step, callback) {
    d3.json(host + "/1.0/metric"
        + "?expression=" + encodeURIComponent(expression)
        + "&start=" + iso(start)
        + "&stop=" + iso(stop)
        + "&step=" + step, function(data) {
      if (!data) return callback(new Error("unable to load data"));
      callback(null, data.map(function(d) { return [iso.parse(d.time), d.value]; }));
    });
  });

  // Returns the Cube host.
  source.toString = function() {
    return host;
  };

  return source;
};
cubism.graphite = function(host) {
  if (!arguments.length) host = "";

  var source = cubism_source(function(expression, start, stop, step, callback) {
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

  // Returns a context shifted by the specified offset in milliseconds.
  context.shift = function(offset) {
    var shift = new cubism_context;
    shift.start = function() { return new Date(+start + offset); };
    shift.stop = function() { return new Date(+stop + offset); };
    shift.delay = context.delay;
    shift.step = function() { return step; };
    shift.size = function() { return size; };
    shift.timeAt = function(i) { return new Date(+start + i * step + offset); };
    return d3.rebind(shift, event, "on");
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
cubism_metric.prototype.add = function(b) {
  return cubism_add(this, b instanceof cubism_metric ? b : cubism_constant(this.size(), b));
};

function cubism_add(a, b) {
  if (a.size() !== b.size()) throw new Error("different size!");
  var metric = new cubism_metric;
  metric.extent = function() { return d3.extent(d3.range(a.size()), metric.valueAt); };
  metric.valueAt = function(i) { return a.valueAt(i) + b.valueAt(i); };
  metric.toString = function() { return a + " + " + b; };
  metric.size = a.size;
  return metric;
};
cubism_metric.prototype.subtract = function(b) {
  return cubism_subtract(this, b instanceof cubism_metric ? b : cubism_constant(this.size(), b));
};

function cubism_subtract(a, b) {
  if (a.size() !== b.size()) throw new Error("different size!");
  var metric = new cubism_metric;
  metric.extent = function() { return d3.extent(d3.range(a.size()), metric.valueAt); };
  metric.valueAt = function(i) { return a.valueAt(i) - b.valueAt(i); };
  metric.toString = function() { return a + " - " + b; };
  metric.size = a.size;
  return metric;
};
cubism_metric.prototype.multiply = function(b) {
  return cubism_multiply(this, b instanceof cubism_metric ? b : cubism_constant(this.size(), b));
};

function cubism_multiply(a, b) {
  if (a.size() !== b.size()) throw new Error("different size!");
  var metric = new cubism_metric;
  metric.extent = function() { return d3.extent(d3.range(a.size()), metric.valueAt); };
  metric.valueAt = function(i) { return a.valueAt(i) * b.valueAt(i); };
  metric.toString = function() { return a + " * " + b; };
  metric.size = a.size;
  return metric;
};
cubism_metric.prototype.divide = function(b) {
  return cubism_divide(this, b instanceof cubism_metric ? b : cubism_constant(this.size(), b));
};

function cubism_divide(a, b) {
  if (a.size() !== b.size()) throw new Error("different size!");
  var metric = new cubism_metric;
  metric.extent = function() { return d3.extent(d3.range(a.size()), metric.valueAt); };
  metric.valueAt = function(i) { return a.valueAt(i) / b.valueAt(i); };
  metric.toString = function() { return a + " / " + b; };
  metric.size = a.size;
  return metric;
};
cubism_context.prototype.constant = function(value) {
  return cubism_constant(this.size(), value);
};

function cubism_constant(size, value) {
  value = +value, size = +size;
  var metric = new cubism_metric;
  metric.extent = function() { return [value, value]; };
  metric.valueAt = function() { return value; };
  metric.toString = function() { return value + ""; };
  metric.size = function() { return size; };
  return metric;
}
cubism_context.prototype.horizon = function() {
  var mode = "offset",
      width = this.size(),
      height = 40,
      metric = cubism_identity,
      title = cubism_identity,
      format = d3.format(".2s");

  // TODO configurable extent
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
          title_ = typeof title === "function" ? title.call(this, d, i) : title;

      if (canvas.empty()) {
        canvas = div.append("canvas").attr("width", width).attr("height", height);
        tspan = div.append("span").attr("class", "title");
        vspan = div.append("span").attr("class", "value");
      }

      var y = d3.scale.linear()
          .domain([0, Math.max(-metric_.extent()[0], metric_.extent()[1])])
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
