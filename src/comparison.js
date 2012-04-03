cubism_context.prototype.comparison = function() {
  var width = this.size(),
      height = 40,
      y = d3.scale.linear().interpolate(d3.interpolateRound),
      primary = function(d) { return d[0]; },
      secondary = function(d) { return d[1]; },
      extent = null,
      title = cubism_identity,
      formatPrimary = cubism_comparisonPrimaryFormat,
      formatChange = cubism_comparisonChangeFormat,
      colors = ["#9ecae1", "#3182bd", "#a1d99b", "#31a354"],
      strokeWidth = 1.5;

  function comparison(selection) {

    selection.append("canvas")
        .attr("width", width)
        .attr("height", height);

    selection.append("span")
        .attr("class", "title")
        .text(title);

    selection.append("span")
        .attr("class", "value primary");

    selection.append("span")
        .attr("class", "value change");

    selection.each(function(d, i) {
      var that = this,
          id = ++cubism_comparisonId,
          div = d3.select(that),
          canvas = div.select("canvas").node().getContext("2d"),
          spanPrimary = div.select(".value.primary"),
          spanChange = div.select(".value.change"),
          primary_ = typeof primary === "function" ? primary.call(that, d, i) : primary,
          secondary_ = typeof secondary === "function" ? secondary.call(that, d, i) : secondary,
          extent_ = typeof extent === "function" ? extent.call(that, d, i) : extent,
          ready;

      function change(start, stop) {
        canvas.save();
        canvas.clearRect(0, 0, width, height);

        // update the y-scale
        var primaryExtent = primary_.extent(),
            secondaryExtent = secondary_.extent(),
            usedExtent = extent_ == null ? primaryExtent : extent_;
        y.domain([0, usedExtent[1]]).range([height, 0]);
        ready = primaryExtent.concat(secondaryExtent).every(isFinite);

        // value
        var valuePrimary = primary_.valueAt(width - 1),
            valueSecondary = secondary_.valueAt(width - 1),
            valueChange = (valuePrimary - valueSecondary) / valueSecondary;

        spanPrimary
            .datum(valuePrimary)
            .text(isNaN(valuePrimary) ? null : formatPrimary);

        spanChange
            .datum(valueChange)
            .text(isNaN(valueChange) ? null : formatChange)
            .attr("class", "value change " + (valueChange > 0 ? "positive" : valueChange < 0 ? "negative" : ""));

        // positive changes
        canvas.fillStyle = colors[2];
        for (var i = 0, n = width; i < n; ++i) {
          var y0 = y(primary_.valueAt(i)),
              y1 = y(secondary_.valueAt(i));
          if (y0 < y1) canvas.fillRect(i & 0xfffffe, y0, 1, y1 - y0);
        }

        // negative changes
        canvas.fillStyle = colors[0];
        for (i = 0; i < n; ++i) {
          var y0 = y(primary_.valueAt(i)),
              y1 = y(secondary_.valueAt(i));
          if (y0 > y1) canvas.fillRect(i & 0xfffffe, y1, 1, y0 - y1);
        }

        // positive values
        canvas.fillStyle = colors[3];
        for (i = 0; i < n; ++i) {
          var y0 = y(primary_.valueAt(i)),
              y1 = y(secondary_.valueAt(i));
          if (y0 <= y1) canvas.fillRect(i & 0xfffffe, y0, 1, strokeWidth);
        }

        // negative values
        canvas.fillStyle = colors[1];
        for (i = 0; i < n; ++i) {
          var y0 = y(primary_.valueAt(i)),
              y1 = y(secondary_.valueAt(i));
          if (y0 > y1) canvas.fillRect(i & 0xfffffe, y0 - strokeWidth, 1, strokeWidth);
        }

        canvas.restore();
      }

      // Display the first primary change immediately,
      // but defer subsequent updates to the context change.
      // Note that someone still needs to listen to the metric,
      // so that it continues to update automatically.
      primary_.on("change.comparison-" + id, firstChange);
      secondary_.on("change.comparison-" + id, firstChange);
      function firstChange(start, stop) {
        change(start, stop);
        if (ready) {
          primary_.on("change.comparison-" + id, cubism_identity);
          secondary_.on("change.comparison-" + id, cubism_identity);
        }
      }

      // Update the chart when the context changes.
      context.on("change.comparison-" + id, change);
    });
   }

  comparison.height = function(_) {
    if (!arguments.length) return height;
    height = +_;
    return comparison;
  };

  comparison.primary = function(_) {
    if (!arguments.length) return primary;
    primary = _;
    return comparison;
  };

  comparison.secondary = function(_) {
    if (!arguments.length) return secondary;
    secondary = _;
    return comparison;
  };

  comparison.extent = function(_) {
    if (!arguments.length) return extent;
    extent = _;
    return comparison;
  };

  comparison.title = function(_) {
    if (!arguments.length) return title;
    title = _;
    return comparison;
  };

  comparison.formatPrimary = function(_) {
    if (!arguments.length) return formatPrimary;
    formatPrimary = _;
    return comparison;
  };

  comparison.formatChange = function(_) {
    if (!arguments.length) return formatChange;
    formatChange = _;
    return comparison;
  };

  comparison.colors = function(_) {
    if (!arguments.length) return colors;
    colors = _;
    return comparison;
  };

  comparison.strokeWidth = function(_) {
    if (!arguments.length) return strokeWidth;
    strokeWidth = _;
    return comparison;
  };

  return comparison;
};

var cubism_comparisonId = 0,
    cubism_comparisonPrimaryFormat = d3.format(".2s"),
    cubism_comparisonChangeFormat = d3.format("+.0%");
