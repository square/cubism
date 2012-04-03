cubism_context.prototype.horizon = function() {
  var context = this,
      mode = "offset",
      width = context.size(),
      height = 40,
      scale = d3.scale.linear().interpolate(d3.interpolateRound),
      metric = cubism_identity,
      extent = null,
      title = cubism_identity,
      format = d3.format(".2s"),
      colors = ["#08519c","#3182bd","#6baed6","#bdd7e7","#bae4b3","#74c476","#31a354","#006d2c"];

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
          id = ++cubism_id,
          canvas = d3.select(that).select("canvas").node().getContext("2d"),
          value = d3.select(that).select(".value"),
          metric_ = typeof metric === "function" ? metric.call(that, d, i) : metric,
          colors_ = typeof colors === "function" ? colors.call(that, d, i) : colors,
          extent_ = typeof extent === "function" ? extent.call(that, d, i) : extent,
          m = colors_.length >> 1,
          ready;

      function change(start, stop) {
        canvas.save();
        canvas.clearRect(0, 0, width, height);

        // update the domain
        var metricExtent = metric_.extent(),
            usedExtent = extent_ == null ? metricExtent : extent_;
        scale.domain([0, Math.max(-usedExtent[0], usedExtent[1])]);
        ready = metricExtent.every(isFinite);

        // value
        v = metric_.valueAt(width - 1);
        value.datum(v).text(isNaN(v) ? null : format);

        // positive bands
        for (var j = 0; j < m; ++j) {
          canvas.fillStyle = colors_[m + j];

          // Adjust the range based on the current band index.
          var y0 = (j - m + 1) * height;
          scale.range([m * height + y0, y0]);
          y0 = scale(0);

          for (var i = 0, n = width, v; i < n; ++i) {
            var v = metric_.valueAt(i);
            if (v <= 0) continue;
            canvas.fillRect(i, v = scale(v), 1, y0 - v);
          }
        }

        // offset mode
        if (mode === "offset") {
          canvas.translate(0, height);
          canvas.scale(1, -1);
        }

        // negative bands
        for (var j = 0; j < m; ++j) {
          canvas.fillStyle = colors_[m - 1 - j];

          // Adjust the range based on the current band index.
          var y0 = (j - m + 1) * height;
          scale.range([m * height + y0, y0]);
          y0 = scale(0);

          for (var i = 0, n = width, v; i < n; ++i) {
            var v = metric_.valueAt(i);
            if (v >= 0) continue;
            canvas.fillRect(i, scale(-v), 1, y0 - scale(-v));
          }
        }

        canvas.restore();
      }

      // Display the first metric change immediately,
      // but defer subsequent updates to the canvas change.
      // Note that someone still needs to listen to the metric,
      // so that it continues to update automatically.
      metric_.on("change.horizon-" + id, function(start, stop) {
        change(start, stop);
        if (ready) metric_.on("change.horizon-" + id, cubism_identity);
      });

      // Update the chart when the context changes.
      context.on("change.horizon-" + id, change);
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

  horizon.scale = function(_) {
    if (!arguments.length) return scale;
    scale = _;
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
