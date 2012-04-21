cubism_contextPrototype.rule = function() {
  var context = this;

  function rule(selection) {
    var id = ++cubism_id;

    var line = selection.append("div")
        .datum({id: id})
        .attr("class", "line")
        .style("position", "fixed")
        .style("top", 0)
        .style("right", 0)
        .style("bottom", 0)
        .style("width", "1px")
        .style("pointer-events", "none");

    context.on("focus.rule-" + id, function(i) {
      line
          .style("display", i == null ? "none" : null)
          .style("left", function() { return this.parentNode.getBoundingClientRect().left + i + "px"; });
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

  return rule;
};
