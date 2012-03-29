cubism_context.prototype.horizon = function() {
  var mode = "offset",
      width = this.size(),
      height = 40,
      metric = cubism_identity,
      extent = null,
      title = cubism_identity,
      format = d3.format(".2s");

  // TODO configurable positive colors
  // TODO configurable negative colors
  // TODO configurable bands

  function horizon(selection) {
    selection.each(function(d, i) {
      var div = d3.select(this),
          canvas = div.select("canvas"),
          tspan = div.select(".title"),
          vspan = div.select(".value"),
          metric_ = typeof metric === "function" ? metric.call(this, d, i) : metric,
          extent_ = typeof extent === "function" ? extent.call(this, d, i) : extent,
          title_ = typeof title === "function" ? title.call(this, d, i) : title;

      if (canvas.empty()) {
        canvas = div.append("canvas").attr("width", width).attr("height", height);
        tspan = div.append("span").attr("class", "title");
        vspan = div.append("span").attr("class", "value");
      }

      if (extent_ == null) extent_ = metric_.extent();

      var y = d3.scale.linear()
          .domain([0, Math.max(-extent_[0], extent_[1])])
          .rangeRound([height, 0]);

      var context = canvas.node().getContext("2d");
      context.clearRect(0, 0, width, height);

      context.fillStyle = "steelblue";
      for (var i = 0, n = width, v; i < n; ++i) {
        var v = metric_.valueAt(i);
        if (v <= 0) continue;
        context.fillRect(i, v = y(v), 1, height - v);
      }

      context.fillStyle = "brown";
      if (mode == "offset") {
        for (var i = 0, n = width, v; i < n; ++i) {
          var v = metric_.valueAt(i);
          if (v >= 0) continue;
          context.fillRect(i, 0, 1, height - y(-v));
        }
      } else {
        for (var i = 0, n = width, v; i < n; ++i) {
          var v = metric_.valueAt(i);
          if (v >= 0) continue;
          context.fillRect(i, v = y(-v), 1, height - v);
        }
      }

      tspan.text(title_);
      vspan.datum(v).text(isNaN(v) ? null : format);
    });
  }

  horizon.mode = function(_) {
    if (!arguments.length) return mode;
    mode = _ + "";
    return horizon;
  };

  horizon.height = function(_) {
    if (!arguments.length) return height;
    height = +_;
    return horizon;
  };

  horizon.metric = function(_) {
    if (!arguments.length) return metric;
    metric = _;
    return horizon;
  };

  horizon.extent = function(_) {
    if (!arguments.length) return extent;
    extent = _;
    return horizon;
  };

  horizon.title = function(_) {
    if (!arguments.length) return title;
    title = _;
    return horizon;
  };

  horizon.format = function(_) {
    if (!arguments.length) return format;
    format = _;
    return horizon;
  };

  return horizon;
};
