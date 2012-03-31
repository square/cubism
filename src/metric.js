function cubism_metric(context, expression) {
  if (!(context instanceof cubism_context)) throw new Error("invalid context");
  expression = expression + "";
  this.context = context;
  this.toString = function() { return expression; };
}

var cubism_metricPrototype = cubism_metric.prototype;

cubism_metricPrototype.valueAt = function() {
  return NaN;
};

cubism_metricPrototype.extent = function() {
  var i = 0,
      n = this.context.size(),
      value,
      min = Infinity,
      max = -Infinity;
  while (++i < n) {
    value = this.valueAt(i);
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return [min, max];
};

cubism_metricPrototype.on = function(type, listener) {
  return arguments.length < 2 ? null : this;
};

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

cubism_metricPrototype.shift = function() {
  return this;
};

cubism_metricPrototype.on = function() {
  return arguments.length < 2 ? null : this;
};

var cubism_metricOperatorId = 0;

function cubism_metricOperator(name, operate) {

  function cubism_metricOperator(left, right) {
    var that = this,
        id = ++cubism_metricOperatorId;

    if (!(right instanceof cubism_metric)) right = new cubism_metricConstant(left.context, right);
    else if (left.context !== right.context) throw new Error("mismatch context");
    cubism_metric.call(this, left.context, left + " " + name + " " + right);
    this.left = left;
    this.right = right;

    // Whenever left or right dispatches a change event, route it to our listeners.
    var event = d3.dispatch("change");
    left.on("change.metric-operator-" + id, change);
    right.on("change.metric-operator-" + id, change);
    d3.rebind(this, event, "on");
    function change() { event.change.apply(that, arguments); }
  }

  var cubism_metricOperatorPrototype = cubism_metricOperator.prototype = Object.create(cubism_metric.prototype);

  cubism_metricOperatorPrototype.valueAt = function(i) {
    return operate(this.left.valueAt(i), this.right.valueAt(i));
  };

  cubism_metricOperatorPrototype.shift = function(offset) {
    return new cubism_metricOperator(this.left.shift(offset), this.right.shift(offset));
  };

  return function(right) {
    return new cubism_metricOperator(this, right);
  };
}

function cubism_metricConstant(context, value) {
  cubism_metric.call(this, context, value = +value);
  this.valueOf = function() { return value; };
}

var cubism_metricConstantPrototype = cubism_metricConstant.prototype = Object.create(cubism_metric.prototype);

cubism_metricConstantPrototype.valueAt = function() {
  return +this;
};

cubism_metricConstantPrototype.extent = function() {
  return [+this, +this];
};
