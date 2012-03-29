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
