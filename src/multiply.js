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
