cubism_contextPrototype.linechart = function() {
  var context = this,
      width = context.size(),
      height = 30,
      summarize = function(d) { if (d.length > 0) { return d[0]; } else { return 0; } }
      scale = d3.scale.linear().interpolate(d3.interpolateRound),
      metrics = cubism_identity,
      title = cubism_identity,
      format = d3.format(".2s"),
      colors = ["#08519c","#3182bd","#6baed6","#bdd7e7","#bae4b3","#74c476","#31a354","#006d2c"],
      step = 1,
      stroke_width = 1,
      axis_width = 0,
      tick_position = [0.4, 0.8];

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
          ready = false;

      function change() {
        if (metrics_.length == 0)
            return;

        var data_set = [],
            data_len = 0,
            data_max = 0;

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
          data_max = Math.max(data_max, Math.ceil(d3.max(data) / 100) * 100);
        }

        if (data_max == 0)
            return;
        ready = true;
        var x = d3.scale.linear().domain([0, data_len]).range([0, width]);
        var y = scale.domain([data_max, 0]).range([0, height]);

        line.x(function(d, i) { return x(i); })
            .y(function(d) { return y(d); });

        svg.selectAll("path").remove();
        svg.selectAll("g").remove();

        svg.append("g")
          .attr("class", "left axis")
          .attr("transform", "translate(" + axis_width + ", 0)")
          .call(d3.svg.axis()
                .scale(y)
                .tickValues(tick_position.map(function(x) { return x * data_max; }))
                .orient("left")
                .tickFormat(function(d) {
                  if (d > 0) { return  d; }
                })
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
      }

      function focus(i) {
        if (i == null)
          i = width - 1;

        if (metrics.length == 0)
          return;

        svg.select(".toolpit-text").selectAll("tspan").remove();

        for (var m in metrics_) {
          var value = metrics_[m].valueAt(Math.floor(i * context.size() / width));
          var txt_value = metrics_[m].toString() + ": " + (isNaN(value) ? "n/a" : format(value));
          svg.select(".toolpit-text").append("tspan").attr("x", 10).attr("y", 15 + 15 * m).text(txt_value);
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
          if (ready)
            metrics_[m].on("change.linechart-" + id, cubism_identity);
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

  return linechart;
};

