(function(exports){
var cubism = exports.cubism = {version: "0.0.1"};
cubism_context.prototype.cube = function(host) {
  return new cubism_cube(this, arguments.length ? host : "");
};

function cubism_cube(context, host) {
  var cube = {},
      iso = d3.time.format.iso;

  cube.host = function() {
    return host;
  };

  cube.metric = function(expression) {
    var metric = [],
        socket = new WebSocket(host + "/1.0/metric/get"),
        event = d3.dispatch("change"),
        reference,
        overlap = 6;

    function refresh() {
      var start = context.start(),
          stop = context.stop(),
          step = context.step(),
          size = context.size();

      if (!reference) reference = start;
      else start = new Date(stop - overlap * step);

      socket.send(JSON.stringify({
        expression: expression,
        start: iso(start),
        stop: iso(stop),
        step: step
      }));

      socket.onmessage = function(message) {
        var d = JSON.parse(message.data);
        d = [iso.parse(d.time), d.value];
        metric[Math.round((d[0] - reference) / step) % size] = d;
        event.change.call(metric, [d]);
      };
    }

    socket.onopen = refresh;

    metric.expression = function() {
      return expression;
    };

    context
        .on("change", refresh)
        .on("cancel", function() { socket.close(); });

    d3.rebind(metric, event, "on");

    return metric;
  };

  return cube;
}
cubism_context.prototype.graphite = function(host) {
  return new cubism_graphite(this, arguments.length ? host : "");
};

function cubism_graphite(context, host) {
  var graphite = {};

  graphite.host = function() {
    return host;
  };

  graphite.metric = function(expression) {
    var metric = [],
        event = d3.dispatch("change"),
        last,
        reference,
        overlap = 6,
        timeout;

    // Start polling after stabilizing.
    setTimeout(refresh, 10);

    function refresh() {
      var start = context.start(),
          stop = context.stop(),
          step = context.step(),
          size = context.size();

      if (!last) last = reference = start;

      d3.text(host + "/render?format=raw"
          + "&target=" + encodeURIComponent("alias(" + expression + ",'')")
          + "&from=" + cubism_graphiteFormatDate(last - 2 * step)
          + "&until=" + cubism_graphiteFormatDate(stop - 1000), function(text) {
        if (text) {
          var data = cubism_graphiteParse(text);
          data.forEach(function(d) { metric[Math.round((d[0] - reference) / step) % size] = d; });
          last = new Date(stop - overlap * step);
          event.change.call(metric, data);
        }
      });
    }

    // When the context changes, delay the request for a half-interval.
    context.on("change", function() {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(refresh, context.step() / 2);
    });

    metric.expression = function() {
      return expression;
    };

    d3.rebind(metric, event, "on");

    return metric;
  };

  return graphite;
}

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
    var delay = +stop + step - Date.now();
    if (delay < step / 2) delay += step;
    timeout = setTimeout(change, delay);
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
    timeout = clearTimeout(timeout);
    event.cancel.call(context);
    return context;
  };

  d3.rebind(context, event, "on");

  return context.step(1e4).size(1440); // 4 hours at 10 seconds
};

function cubism_context() {}
})(this);
