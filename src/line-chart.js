cubism_contextPrototype.linechart = function() {
  var context = this,
      width = context.size(),
      height = 30,
      summarize = function(d) { if (d.length > 0) { return d[0]; } else { return 0; } }
      scale = d3.scale.linear().interpolate(d3.interpolateRound),
      metrics = cubism_identity,
      title = cubism_identity,
      format = d3.format("f"),
      tickFormat = function(d) { if (d > 0) { return  d; } }
      colors = ["#08519c","#74c476","#6baed6","#006d2c","#3182bd","#bae4b3","#bdd7e7","#31a354"],
      step = 1,
      stroke_width = 1,
      axis_width = 0,
      tick_position = [0.4, 0.8],
      auto_min = false,
      auto_max = true;

  function linechart(selection) {

    selection
      .on("mousemove.linechart", function() { context.focus(Math.round(d3.mouse(this)[0])); })
      .on("mouseout.linechart", function() { context.focus(null); });

    selection.append("svg")
      .attr("width", width)
      .attr("height", height);

    selection.each(function(d, i) {

      var that = this,
          metrics_ = typeof metrics === "function" ? metrics.call(that, d, i) : metrics,
          id = ++cubism_id,
          line = d3.svg.line().interpolate("basis"),
          svg = d3.select(that).select("svg"),
          ready = 0;

      function change() {
        if (metrics_.length == 0)
            return;

        var data_set = [],
            data_len = 0,
            data_max = 0,
            data_min = Infinity;

        for (var m in metrics_) {
          var data = [],
              i = 0;

          while (i < context.size()) {
            var window = [];

            for (var j = 0; j < step && i < context.size(); ++j, ++i) {
              window.push(metrics_[m].valueAt(i));
            }

            var value = summarize(window);
            if (isFinite(value)) {
              data.push(value);
            } else {
              data.push(0);
            }
          }

          data_set.push(data);
          data_len = data.length;

          var mm, nn, hh;

          /* the real mininum and maxinum value in the current dataset */
          mm = d3.max(data);
          nn = d3.min(data);

          /* constant value */
          if (mm == nn) {
            /* if mm is zero, display a default range from -10 to 10 */
            hh = Math.min(10, mm * 0.2);
            max = mm + hh;
            min = mm - hh;
          }
          /* there is a range, make it look nice */
          else {
            hh = Math.pow(10, Math.floor(Math.log(mm < 1 ? 1 : mm) / Math.LN10));
            while (hh > (mm - nn) / 2)
              hh = hh / 10;
            min = Math.floor(nn / hh) * hh;
            max = (1 + Math.floor(mm / hh)) * hh
          }

          if (auto_min) data_min = Math.min(data_min, min);
          if (auto_max) data_max = Math.max(data_max, max);
        }

        if (!isFinite(data_max))
          return;
        if (!isFinite(data_min))
          data_min = 0;

        var x = d3.scale.linear().domain([0, data_len]).range([0, width]);
        var y = scale.domain([data_max, data_min]).range([0, height]);

        line.x(function(d, i) { return x(i); })
            .y(function(d) { return y(d); });

        svg.selectAll("path").remove();
        svg.selectAll("g").remove();

        svg.append("g")
          .attr("class", "left axis")
          .attr("transform", "translate(" + axis_width + ", 0)")
          .call(d3.svg.axis()
                .scale(y)
                .tickValues(tick_position.map(function(x) {
                  return x * data_max + (1 - x) * data_min;
                }))
                .orient("left")
                .tickFormat(tickFormat)
               );

        var data_offset = Math.floor(axis_width * data_len / width);
        for (var d in data_set) {
          svg.append("path").attr("d", line(data_set[d].slice(data_offset)))
            .attr("transform", "translate(" + axis_width + ", 0)")
            .attr("width", width - axis_width)
            .attr("stroke", colors[d])
            .attr("stroke-width", stroke_width)
            .attr("fill", "none");
        }

        svg.append("g").attr("class", "toolpit");

        svg.select(".toolpit").append("rect")
          .attr("class", "toolpit-rect")
          .attr("x", 5)
          .attr("rx", 5)
          .attr("ry", 5)
          .attr("stroke", "grey")
          .attr("stroke-width", 2)
          .attr("fill", "rgb(255,255,255)")
          .attr("fill-opacity", 0.8);

        svg.select(".toolpit").append("text")
          .attr("class", "toolpit-text")
          .attr("font-family", "courier")
          .attr("font-size", 12);

        ready += 1;
      }

      function focus(i) {
        if (i == null)
          i = width - 1;

        if (metrics.length == 0)
          return;

        svg.select(".toolpit-text").selectAll("tspan").remove();

        for (var m in metrics_) {
          var ppp = width / context.size(); // pixel_per_point
          if (ppp > 1) {
            var p0 = Math.floor(i / ppp);
            var p1 = p0 + 1;
            var pr = i / ppp - p0;
            var value = (1 - pr) * metrics_[m].valueAt(p0) + pr * metrics_[m].valueAt(p1);
          } else {
            var value = metrics_[m].valueAt(i);
          }

          svg.select(".toolpit-text").append("tspan")
            .attr("x", 10).attr("y", 15 + 15 * m)
            .attr("style", "font-weight:bold")
            .text(metrics_[m].toString() + ": ");

          svg.select(".toolpit-text").append("tspan")
            .attr("y", 15 + 15 * m)
            .attr("style", "stroke:" + colors[m])
            .text(isNaN(value) ? "n/a" : format(value));
        }

        var txt_width = 10,
            txt_height = 10;
        svg.select(".toolpit-text").each(function() {
          txt_width = Math.max(txt_width, this.getBBox().width + 10);
          txt_height = Math.max(txt_height, this.getBBox().height + 10);
        });

        var dx = (i < width - txt_width - 10) ? i : i - txt_width - 10,
            dy = 0.9 * height - txt_height;
        svg.select(".toolpit").attr("transform", "translate(" + dx + ", " + dy + ")");
        svg.select(".toolpit-rect").attr("width", txt_width);
        svg.select(".toolpit-rect").attr("height", txt_height);
      }

      // Update the chart when the context changes.
      context.on("change.linechart-" + id, change);
      context.on("focus.linechart-" + id, focus);

      for (var m in metrics_) {
        metrics_[m].on("change.linechart-" + id, function(start, stop) {
          change(), focus();
          if (ready == metrics_.length) metrics_[m].on("change.linechart-" + id, cubism_identity);
        });
      }
    });
  }

  linechart.remove = function(selection) {

    selection
        .on("mousemove.linechart", null)
        .on("mouseout.linechart", null);

    selection.selectAll("svg")
        .each(remove)
        .remove();

    selection.selectAll(".toolpit")
        .remove();

    function remove(d) {
      d.metrics[0].on("change.linechart-" + d.id, null);
      context.on("change.linechart-" + d.id, null);
      context.on("focus.linechart-" + d.id, null);
    }
  };

  linechart.height = function(_) {
    if (!arguments.length) return height;
    height = +_;
    return linechart;
  };

  linechart.width = function(_) {
    if (!arguments.length) return width;
    width = +_;
    return linechart;
  };

  linechart.summarize = function(_) {
    if (!arguments.length) return summarize;
    summarize = _;
    return linechart;
  };

  linechart.metrics = function(_) {
    if (!arguments.length) return metrics;
    metrics = _;
    return linechart;
  };

  linechart.scale = function(_) {
    if (!arguments.length) return scale;
    scale = _;
    return linechart;
  };

  linechart.title = function(_) {
    if (!arguments.length) return title;
    title = _;
    return linechart;
  };

  linechart.format = function(_) {
    if (!arguments.length) return format;
    format = _;
    return linechart;
  };

  linechart.tickFormat = function(_) {
    if (!arguments.length) return tickFormat;
    tickFormat = _;
    return linechart;
  };

  linechart.colors = function(_) {
    if (!arguments.length) return colors;
    colors = _;
    return linechart;
  };

  linechart.step = function(_) {
    if (!arguments.length) return step;
    if (+_ > 0) step = +_;
    return linechart;
  };

  linechart.stroke_width = function(_) {
    if (!arguments.length) return stroke_width;
    stroke_width = _;
    return linechart;
  };

  linechart.axis_width = function(_) {
    if (!arguments.length) return axis_width;
    axis_width = +_;
    return linechart;
  };

  linechart.tick_position = function(_) {
    if (!arguments.length) return tick_position;
    tick_position = _;
    return linechart;
  };

  linechart.auto_min = function(_) {
    if (!arguments.length) return auto_min;
    auto_min = _;
    return linechart;
  };

  return linechart;
};

