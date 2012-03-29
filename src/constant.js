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
