cubism_context.prototype.axis = function() {
  var context = this,
      axis_ = d3.svg.axis().scale(context.scale);

  function axis(selection) {
    context.on("change.axis-" + ++cubism_id, function() {
      selection.call(axis_);
    });
  }

  return d3.rebind(axis, axis_,
      "orient",
      "ticks",
      "tickSubdivide",
      "tickSize",
      "tickPadding",
      "tickFormat");
};
