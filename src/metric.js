function cubism_metric() {}

var cubism_metricId = 0;

cubism_metric.prototype.add = cubism_metricComposer("+", function(a, b) { return a + b; });
cubism_metric.prototype.subtract = cubism_metricComposer("-", function(a, b) { return a - b; });
cubism_metric.prototype.multiply = cubism_metricComposer("*", function(a, b) { return a * b; });
cubism_metric.prototype.divide = cubism_metricComposer("/", function(a, b) { return a / b; });

cubism_context.prototype.constant = function(value) {
  return cubism_metricConstant(this.size(), value);
};

function cubism_metricConstant(size, value) {
  value = +value, size = +size;
  var metric = new cubism_metric;
  metric.extent = function() { return [value, value]; };
  metric.valueAt = function() { return value; };
  metric.toString = function() { return value + ""; };
  metric.size = function() { return size; };
  return metric;
}

function cubism_metricComposer(name, operator) {
  return function compose(b) {
    var a = this;
    if (!(b instanceof cubism_metric)) b = cubism_metricConstant(a.size(), b);
    if (a.size() !== b.size()) throw new Error("different size!");
    var metric = new cubism_metric;
    metric.extent = function() { return d3.extent(d3.range(a.size()), metric.valueAt); };
    metric.valueAt = function(i) { return operator(a.valueAt(i), b.valueAt(i)); };
    metric.toString = function() { return a + " " + name + " " + b; };
    metric.size = a.size;
    metric.shift = function(offset) { return compose(a.shift(offset), b.shift(offset)); };
    return metric;
  };
}
