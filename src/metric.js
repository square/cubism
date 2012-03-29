function cubism_metric() {}

var cubism_metricId = 0;

cubism_metric.prototype.add = cubism_metricComposer("+", function(a, b) { return a + b; });
cubism_metric.prototype.subtract = cubism_metricComposer("-", function(a, b) { return a - b; });
cubism_metric.prototype.multiply = cubism_metricComposer("*", function(a, b) { return a * b; });
cubism_metric.prototype.divide = cubism_metricComposer("/", function(a, b) { return a / b; });

function cubism_metricComposer(name, operator) {
  return function compose(b) {
    var a = this;
    if (!(b instanceof cubism_metric)) b = cubism_contextConstant(a.size(), b);
    if (a.size() !== b.size()) throw new Error("different size!");
    var metric = new cubism_metric;
    metric.extent = function() { return d3.extent(d3.range(a.size()), metric.valueAt); };
    metric.valueAt = function(i) { return operator(a.valueAt(i), b.valueAt(i)); };
    metric.toString = function() { return a + " " + name + " " + b; };
    metric.size = a.size;
    metric.shift = function() { return compose(a.shift.apply(a, arguments), b.shift.apply(b, arguments)); };
    return metric;
  };
}
