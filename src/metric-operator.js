function cubism_metricOperator(name, operate) {

  function cubism_metricOperator(left, right) {
    if (!(right instanceof cubism_metric)) right = new cubism_metricConstant(left.context, right);
    else if (left.context !== right.context) throw new Error("mismatch context");
    cubism_metric.call(this, left.context);
    this.left = left;
    this.right = right;
    this.toString = function() { return left + " " + name + " " + right; };
  }

  var cubism_metricOperatorPrototype = cubism_metricOperator.prototype = Object.create(cubism_metric.prototype);

  cubism_metricOperatorPrototype.valueAt = function(i) {
    return operate(this.left.valueAt(i), this.right.valueAt(i));
  };

  cubism_metricOperatorPrototype.shift = function(offset) {
    return new cubism_metricOperator(this.left.shift(offset), this.right.shift(offset));
  };

  cubism_metricOperatorPrototype.on = function(type, listener) {
    if (arguments.length < 2) return this.left.on(type);
    this.left.on(type, listener);
    this.right.on(type, listener);
    return this;
  };

  return function(right) {
    return new cubism_metricOperator(this, right);
  };
}

cubism_metricPrototype.add = cubism_metricOperator("+", function(left, right) {
  return left + right;
});

cubism_metricPrototype.subtract = cubism_metricOperator("-", function(left, right) {
  return left - right;
});

cubism_metricPrototype.multiply = cubism_metricOperator("*", function(left, right) {
  return left * right;
});

cubism_metricPrototype.divide = cubism_metricOperator("/", function(left, right) {
  return left / right;
});
