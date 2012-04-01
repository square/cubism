cubism_context.prototype.comparison = function() {
  var id = ++cubism_comparisonId,
      width = this.size(),
      height = 40,
      y = d3.scale.linear().interpolate(d3.interpolateRound),
      primary = function(d) { return d[0]; },
      secondary = function(d) { return d[1]; },
      extent = null,
      title = cubism_identity,
      formatPrimary = cubism_comparisonPrimaryFormat,
      formatChange = cubism_comparisonChangeFormat,
      colors = ["#3182bd", "#31a354"],
      stroke = "#000000",
      strokeWidth = 2,
      fill = "rgba(0,0,0,.2)",
      changes = [];

  // Dispatch change events to all registered listeners.
  context.on("change.comparison-" + id, function(start, stop) {
    changes.forEach(function(change) {
      change(start, stop);
    });
  });

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
          div = d3.select(that),
          context = div.select("canvas").node().getContext("2d"),
          spanPrimary = div.select(".value.primary"),
          spanChange = div.select(".value.change"),
          primary_ = typeof primary === "function" ? primary.call(that, d, i) : primary,
          secondary_ = typeof secondary === "function" ? secondary.call(that, d, i) : secondary,
          extent_ = typeof extent === "function" ? extent.call(that, d, i) : extent;

      function change(start, stop) {
        context.save();
        context.clearRect(0, 0, width, height);

        // update the y-domain
        var maxPrimary = Math.abs((extent_ == null ? primary_.extent() : extent_)[1]),
            maxSecondary = Math.abs((extent_ == null ? secondary_.extent() : extent_)[1]);
        y.domain([0, Math.max(maxPrimary, maxSecondary)]);

        // update the y-range
        y.range([height, 0]);

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

        // primary value
        context.fillStyle = fill;
        for (var i = 0, n = width, v; i < n; ++i) {
          var y0 = y(primary_.valueAt(i));
          context.fillRect(i, y0, 1, height - y0);
        }

        // positive changes
        context.fillStyle = colors[1];
        for (var i = 0, n = width, v; i < n; ++i) {
          var y0 = y(primary_.valueAt(i)),
              y1 = y(secondary_.valueAt(i));
          if (y0 < y1) context.fillRect(i, y0, 1, y1 - y0);
        }

        // negative changes
        context.fillStyle = colors[0];
        for (var i = 0, n = width, v; i < n; ++i) {
          var y0 = y(primary_.valueAt(i)),
              y1 = y(secondary_.valueAt(i));
          if (y0 > y1) context.fillRect(i, y1, 1, y0 - y1);
        }

        // primary value
        if (strokeWidth > 0) {
          context.fillStyle = stroke;
          for (var i = 0, n = width, v; i < n; ++i) {
            var y0 = y(primary_.valueAt(i));
            context.fillRect(i, y0 - strokeWidth / 2, 1, strokeWidth);
          }
        }

        context.restore();
      }

      // Display the first primary change immediately,
      // but defer subsequent updates to the context change.
      function firstChange(start, stop) {
        change(start, stop);
        if (y.domain().every(isFinite)) {
          primary_.on("change.comparison-" + id, null);
          secondary_.on("change.comparison-" + id, null);
        }
      }

      primary_.on("change.comparison-" + id, firstChange);
      secondary_.on("change.comparison-" + id, firstChange);
      changes.push(change);
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

  comparison.stroke = function(_) {
    if (!arguments.length) return stroke;
    stroke = _;
    return comparison;
  };

  comparison.strokeWidth = function(_) {
    if (!arguments.length) return strokeWidth;
    strokeWidth = _;
    return comparison;
  };

  comparison.fill = function(_) {
    if (!arguments.length) return fill;
    fill = _;
    return comparison;
  };

  return comparison;
};

var cubism_comparisonId = 0,
    cubism_comparisonPrimaryFormat = d3.format(".2s"),
    cubism_comparisonChangeFormat = d3.format("+.0%");
