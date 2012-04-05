cubism_context.prototype.rule = function() {
  var context = this;

  function rule(selection) {
    var line = selection.append("div")
        .attr("class", "line")
        .style("position", "fixed")
        .style("top", 0)
        .style("right", 0)
        .style("bottom", 0)
        .style("width", "1px")
        .style("pointer-events", "none");

    context.on("focus.rule-" + ++cubism_id, function(i) {
      if (d3.event) line
          .style("display", i == null ? "none" : null)
          .style("left", d3.event.clientX + "px");
    });
  }

  return rule;
};
