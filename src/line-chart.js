cubism_contextPrototype.linechart = function() {
  var context = this,
      width = context.size(),
      height = 30,
      summarize = function(d) { if (d.length > 0) { return d[0]; } else { return 0; } }
      scale = d3.scale.linear().interpolate(d3.interpolateRound),
      metric = cubism_identity,
      title = cubism_identity,
      format = d3.format(".2s"),
      colors = ["#08519c","#3182bd","#6baed6","#bdd7e7","#bae4b3","#74c476","#31a354","#006d2c"],
      step = 1,
      stroke_width = 1,
      show_yaxis = false;

  function linechart(selection) {

    selection
        .on("mousemove.linechart", function() { context.focus(Math.round(d3.mouse(this)[0])); })
        .on("mouseout.linechart", function() { context.focus(null); });

    selection.append("svg")
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
          metric_ = typeof metric === "function" ? metric.call(that, d, i) : metric,
          colors_ = typeof colors === "function" ? colors.call(that, d, i) : colors,
          line = d3.svg.line().interpolate("basis"),
          svg = d3.select(that).select("svg"),
          span = d3.select(that).select(".value"),
          ymax = 100,
          m = colors_.length >> 1;

      function change() {
        var data = [],
            i = 0;

        while (i < context.size()) {
          var window = [],
              value = 0;

          for (var j = 0; j < step && i < context.size(); ++j, ++i)
            window.push(metric_.valueAt(i));

          value = summarize(window);
          if (isFinite(value)) {
            data.push(value);
          } else {
            data.push(0);
          }
        }

        ymax = Math.ceil(d3.max(data) / 100) * 100;

        if (ymax == 0) return;

        var x = d3.scale.linear().domain([0, data.length]).range([0, width]);
        var y = scale.domain([ymax, 0]).range([0, height]);

        line.x(function(d, i) { return x(i); })
            .y(function(d) { return y(d); });

        svg.selectAll("path").remove();
        svg.selectAll("g").remove();

        if (show_yaxis) {
          svg.append("g")
            .attr("class", "left axis")
            .attr("transform", "translate(40, 0)")
            .call(d3.svg.axis()
                  .scale(y)
                  .tickValues([0.4 * ymax, 0.8 * ymax])
                  .orient("left")
                  .tickFormat(function(d) {
                    if (d > 0) { return  d; }
                  })
                 );
        };

        svg.append("path").attr("d", line(data))
          .attr("stroke", colors_[m])
          .attr("stroke-width", stroke_width)
          .attr("fill", "none");
      }

      function focus(i) {
        if (i == null) i = width - 1;
        var value = metric_.valueAt(Math.floor(i * context.size() / width));
        span.datum(value).text(isNaN(value) ? null : format);
      }

      // Update the chart when the context changes.
      context.on("change.linechart-" + id, change);
      context.on("focus.linechart-" + id, focus);

      metric_.on("change.linechart-" + id, function(start, stop) {
        change(), focus();
        if (ymax > 0) metric_.on("change.linechart-" + id, cubism_identity);
      });
    });
  }

  linechart.remove = function(selection) {

    selection
        .on("mousemove.linechart", null)
        .on("mouseout.linechart", null);

    selection.selectAll("svg")
        .each(remove)
        .remove();

    selection.selectAll(".title,.value")
        .remove();

    function remove(d) {
      d.metric.on("change.linechart-" + d.id, null);
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

  linechart.metric = function(_) {
    if (!arguments.length) return metric;
    metric = _;
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
    step = _;
    return linechart;
  };

  linechart.stroke_width = function(_) {
    if (!arguments.length) return stroke_width;
    stroke_width = _;
    return linechart;
  };

  linechart.show_yaxis = function(_) {
    if (!arguments.length) return show_yaxis;
    show_yaxis = _;
    return linechart;
  };

  return linechart;
};
