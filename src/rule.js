cubism_contextPrototype.rule = function() {
  var context = this,
      metric = cubism_identity;

  function rule(selection) {
    var id = ++cubism_id;

    var line = selection.append("div")
        .datum({id: id})
        .attr("class", "line")
        .call(cubism_ruleStyle);

    selection.each(function(d, i) {
      var that = this,
          id = ++cubism_id,
          metric_ = typeof metric === "function" ? metric.call(that, d, i) : metric;

      if (!metric_) return;

      function change(start, stop) {
        var values = [];

        for (var i = 0, n = context.size(); i < n; ++i) {
          if (metric_.valueAt(i)) {
            values.push(i);
          }
        }

        var lines = selection.selectAll(".metric").data(values);
        lines.exit().remove();
        lines.enter().append("div").attr("class", "metric line").call(cubism_ruleStyle);
        lines.style("left", cubism_ruleLeft);
      }

      context.on("change.rule-" + id, change);
      metric_.on("change.rule-" + id, change);
    });

    context.on("focus.rule-" + id, function(i) {
      line.datum(i)
          .style("display", i == null ? "none" : null)
          .style("left", i == null ? null : cubism_ruleLeft);
    });
  }

  rule.remove = function(selection) {

    selection.selectAll(".line")
        .each(remove)
        .remove();

    function remove(d) {
      context.on("focus.rule-" + d.id, null);
    }
  };

  rule.metric = function(_) {
    if (!arguments.length) return metric;
    metric = _;
    return rule;
  };

  return rule;
};

function cubism_ruleStyle(line) {
  line
      .style("position", "absolute")
      .style("top", 0)
      .style("bottom", 0)
      .style("width", "1px")
      .style("pointer-events", "none");
}

function cubism_ruleLeft(i) {
  return i + "px";
}
