(function(exports){
var cubism = exports.cubism = {version: "0.0.1"};
function cubism_identity(d) { return d; }
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
function cubism_metric(context, expression) {
  if (!(context instanceof cubism_context)) throw new Error("invalid context");
  expression = expression + "";
  this.context = context;
  this.toString = function() { return expression; };
}

var cubism_metricPrototype = cubism_metric.prototype;

cubism_metricPrototype.valueAt = function() {
  return NaN;
};

cubism_metricPrototype.extent = function() {
  var i = 0,
      n = this.context.size(),
      value,
      min = Infinity,
      max = -Infinity;
  while (++i < n) {
    value = this.valueAt(i);
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return [min, max];
};

cubism_metricPrototype.on = function(type, listener) {
  return arguments.length < 2 ? null : this;
};

cubism_metricPrototype.add = cubism_metricOperator("+", function(left, right) {
  return left + right;
});

cubism_metricPrototype.subtract = cubism_metricOperator("-", function(left, right) {
  return left - right;
});

cubism_metricPrototype.multiply = cubism_metricOperator("*", function(left, right) {
  return left * right;
});

cubism_metricPrototype.divide = cubism_metricOperator("/", function(left, right) {
  return left / right;
});

cubism_metricPrototype.shift = function() {
  return this;
};

cubism_metricPrototype.on = function() {
  return arguments.length < 2 ? null : this;
};

var cubism_metricOperatorId = 0;

function cubism_metricOperator(name, operate) {

  function cubism_metricOperator(left, right) {
    var that = this,
        id = ++cubism_metricOperatorId;

    if (!(right instanceof cubism_metric)) right = new cubism_metricConstant(left.context, right);
    else if (left.context !== right.context) throw new Error("mismatch context");
    cubism_metric.call(this, left.context, left + " " + name + " " + right);
    this.left = left;
    this.right = right;

    // Whenever left or right dispatches a change event, route it to our listeners.
    var event = d3.dispatch("change");
    left.on("change.metric-operator-" + id, change);
    right.on("change.metric-operator-" + id, change);
    d3.rebind(this, event, "on");
    function change() { event.change.apply(that, arguments); }
  }

  var cubism_metricOperatorPrototype = cubism_metricOperator.prototype = Object.create(cubism_metric.prototype);

  cubism_metricOperatorPrototype.valueAt = function(i) {
    return operate(this.left.valueAt(i), this.right.valueAt(i));
  };

  cubism_metricOperatorPrototype.shift = function(offset) {
    return new cubism_metricOperator(this.left.shift(offset), this.right.shift(offset));
  };

  return function(right) {
    return new cubism_metricOperator(this, right);
  };
}

function cubism_metricConstant(context, value) {
  cubism_metric.call(this, context, value = +value);
  this.valueOf = function() { return value; };
}

var cubism_metricConstantPrototype = cubism_metricConstant.prototype = Object.create(cubism_metric.prototype);

cubism_metricConstantPrototype.valueAt = function() {
  return +this;
};

cubism_metricConstantPrototype.extent = function() {
  return [+this, +this];
};
cubism_context.prototype.cube = function(host) {
  if (!arguments.length) host = "";

  var source = cubism_source(this, function(expression, start, stop, step, callback) {
    d3.json(host + "/1.0/metric"
        + "?expression=" + encodeURIComponent(expression)
        + "&start=" + cubism_cubeFormatDate(start)
        + "&stop=" + cubism_cubeFormatDate(new Date(+stop + step)) // off-by-one?
        + "&step=" + step, function(data) {
      if (!data) return callback(new Error("unable to load data"));
      callback(null, data.map(function(d) { return d.value; }));
    });
  });

  // Returns the Cube host.
  source.toString = function() {
    return host;
  };

  return source;
};

var cubism_cubeFormatDate = d3.time.format.iso;
cubism_context.prototype.graphite = function(host) {
  if (!arguments.length) host = "";

  var source = cubism_source(this, function(expression, start, stop, step, callback) {
    d3.text(host + "/render?format=raw"
        + "&target=" + encodeURIComponent("alias(" + expression + ",'')")
        + "&from=" + cubism_graphiteFormatDate(start - 2 * step) // off-by-two?
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
      .slice(1) // the first value is always None?
      .map(function(d) { return +d; });
}
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
cubism_context.prototype.horizon = function() {
  var mode = "offset",
      id = ++cubism_horizonId,
      width = this.size(),
      height = 40,
      y = d3.scale.linear().interpolate(d3.interpolateRound),
      metric = cubism_identity,
      extent = null,
      title = cubism_identity,
      format = d3.format(".2s"),
      colors = ["#08519c","#3182bd","#6baed6","#bdd7e7","#bae4b3","#74c476","#31a354","#006d2c"],
      changes = [];

  // Dispatch change events to all registered listeners.
  context.on("change.horizon-" + id, function(start, stop) {
    changes.forEach(function(change) {
      change(start, stop);
    });
  });

  function horizon(selection) {

    selection.append("canvas")
        .attr("width", width)
        .attr("height", height);

    selection.append("span")
        .attr("class", "title")
        .text(title);

    selection.append("span")
        .attr("class", "value");

    selection.each(function(d, i) {
      var that = this,
          context = d3.select(that).select("canvas").node().getContext("2d"),
          value = d3.select(that).select(".value"),
          metric_ = typeof metric === "function" ? metric.call(that, d, i) : metric,
          colors_ = typeof colors === "function" ? colors.call(that, d, i) : colors,
          extent_ = typeof extent === "function" ? extent.call(that, d, i) : extent,
          m = colors_.length >> 1;

      function change(start, stop) {
        context.save();
        context.clearRect(0, 0, width, height);

        // update the y-domain
        var extent__ = extent_ == null ? metric_.extent() : extent_;
        y.domain([0, Math.max(-extent__[0], extent__[1])]);

        // value
        v = metric_.valueAt(width - 1);
        value.datum(v).text(isNaN(v) ? null : format);

        // positive bands
        for (var j = 0; j < m; ++j) {
          context.fillStyle = colors_[m + j];

          // Adjust the y-range based on the current band index.
          var y0 = (j - m + 1) * height;
          y.range([m * height + y0, y0]);

          for (var i = 0, n = width, v; i < n; ++i) {
            var v = metric_.valueAt(i);
            if (v <= 0) continue;
            context.fillRect(i, v = y(v), 1, y(0) - v);
          }
        }

        // offset mode
        if (mode === "offset") {
          context.translate(0, height);
          context.scale(1, -1);
        }

        // negative bands
        for (var j = 0; j < m; ++j) {
          context.fillStyle = colors_[m - 1 - j];

          // Adjust the y-range based on the current band index.
          var y0 = (j - m + 1) * height;
          y.range([m * height + y0, y0]);

          for (var i = 0, n = width, v; i < n; ++i) {
            var v = metric_.valueAt(i);
            if (v >= 0) continue;
            context.fillRect(i, y(-v), 1, y(0) - y(-v));
          }
        }

        context.restore();
      }

      // Display the first metric change immediately,
      // but defer subsequent updates to the context change.
      metric_.on("change.horizon-" + id, function(start, stop) {
        change(start, stop);
        if (isFinite(y.domain()[1])) metric_.on("change.horizon-" + id, null);
      });

      changes.push(change);
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

  horizon.colors = function(_) {
    if (!arguments.length) return colors;
    colors = _;
    return horizon;
  };

  return horizon;
};

var cubism_horizonId = 0;
})(this);
