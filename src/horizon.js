cubism_context.prototype.horizon = function() {
  var mode = "offset",
      id = ++cubism_horizonId,
      width = this.size(),
      height = 40,
      y = d3.scale.linear().interpolate(d3.interpolateRound),
      metric = cubism_identity,
      extent = null,
      title = cubism_identity,
      format = d3.format(".2s"),
      colors = ["#08519c","#3182bd","#6baed6","#bdd7e7","#bae4b3","#74c476","#31a354","#006d2c"],
      changes = [];

  // Dispatch change events to all registered listeners.
  context.on("change.horizon-" + id, function(start, stop) {
    changes.forEach(function(change) {
      change(start, stop);
    });
  });

  function horizon(selection) {

    selection.append("canvas")
        .attr("width", width)
        .attr("height", height);

    selection.append("span")
        .attr("class", "title")
        .text(title);

    selection.append("span")
        .attr("class", "value");

    selection.each(function(d, i) {
      var that = this,
          context = d3.select(that).select("canvas").node().getContext("2d"),
          value = d3.select(that).select(".value"),
          metric_ = typeof metric === "function" ? metric.call(that, d, i) : metric,
          colors_ = typeof colors === "function" ? colors.call(that, d, i) : colors,
          extent_ = typeof extent === "function" ? extent.call(that, d, i) : extent,
          m = colors_.length >> 1;

      function change(start, stop) {
        context.save();
        context.clearRect(0, 0, width, height);

        // update the y-domain
        var extent__ = extent_ == null ? metric_.extent() : extent_;
        y.domain([0, Math.max(-extent__[0], extent__[1])]);

        // value
        v = metric_.valueAt(width - 1);
        value.datum(v).text(isNaN(v) ? null : format);

        // positive bands
        for (var j = 0; j < m; ++j) {
          context.fillStyle = colors_[m + j];

          // Adjust the y-range based on the current band index.
          var y0 = (j - m + 1) * height;
          y.range([m * height + y0, y0]);

          for (var i = 0, n = width, v; i < n; ++i) {
            var v = metric_.valueAt(i);
            if (v <= 0) continue;
            context.fillRect(i, v = y(v), 1, y(0) - v);
          }
        }

        // offset mode
        if (mode === "offset") {
          context.translate(0, height);
          context.scale(1, -1);
        }

        // negative bands
        for (var j = 0; j < m; ++j) {
          context.fillStyle = colors_[m - 1 - j];

          // Adjust the y-range based on the current band index.
          var y0 = (j - m + 1) * height;
          y.range([m * height + y0, y0]);

          for (var i = 0, n = width, v; i < n; ++i) {
            var v = metric_.valueAt(i);
            if (v >= 0) continue;
            context.fillRect(i, y(-v), 1, y(0) - y(-v));
          }
        }

        context.restore();
      }

      // Display the first metric change immediately,
      // but defer subsequent updates to the context change.
      metric_.on("change.horizon-" + id, function(start, stop) {
        change(start, stop);
        if (isFinite(y.domain()[1])) metric_.on("change.horizon-" + id, null);
      });

      changes.push(change);
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

  horizon.colors = function(_) {
    if (!arguments.length) return colors;
    colors = _;
    return horizon;
  };

  return horizon;
};

var cubism_horizonId = 0;
