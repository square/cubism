cubism_contextPrototype.rule = function() {
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
      line
          .style("display", i == null ? "none" : null)
          .style("left", function() { return this.parentNode.getBoundingClientRect().left + i + "px"; });
    });
  }

  return rule;
};
