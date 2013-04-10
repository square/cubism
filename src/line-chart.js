cubism_contextPrototype.linechart = function() {
  var context = this,
      width = context.size(),
      height = 30,
      ymax = 100,
      line = d3.svg.line().interpolate("basis"),
      scale = d3.scale.linear().interpolate(d3.interpolateRound),
      metric = cubism_identity,
      extent = null,
      title = cubism_identity,
      format = d3.format(".2s"),
      colors = ["#08519c","#3182bd","#6baed6","#bdd7e7","#bae4b3","#74c476","#31a354","#006d2c"];

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
          extent_ = typeof extent === "function" ? extent.call(that, d, i) : extent,
          step = context.step(),
          svg = d3.select(that).select("svg"),
          span = d3.select(that).select(".value"),
          max_,
          m = colors_.length >> 1,
          ready;

      function change() {
        // compute the new extent and ready flag
        var extent = metric_.extent(),
            data = [],
            value = 0;

        ready = extent.every(isFinite);
        if (extent_ != null) extent = extent_;

        for (var i = 0; i < width; ++i) {
          value = metric_.valueAt(i);
          if (value) {
            data.push(value);
          } else {
            data.push(0);
          }
        }

        ymax = Math.ceil(d3.max(data) / 100) * 100;
        var x = d3.scale.linear().domain([0, data.length]).range([0, width]);
        var y = scale.domain([ymax, 0]).range([0, height]);

        line.x(function(d, i) { return x(i); })
            .y(function(d) { return y(d); });


        svg.selectAll("path").remove()
        svg.selectAll("g").remove()

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

        svg.append("path").attr("d", line(data))
          .attr("stroke", colors_[m])
          .attr("stroke-width", 1)
          .attr("fill", "none");
      }

      function focus(i) {
        if (i == null) i = width - 1;
        var value = metric_.valueAt(i);
        span.datum(value).text(isNaN(value) ? null : format);
      }

      // Update the chart when the context changes.
      context.on("change.linechart-" + id, change);
      context.on("focus.linechart-" + id, focus);

      // Display the first metric change immediately,
      // but defer subsequent updates to the canvas change.
      // Note that someone still needs to listen to the metric,
      // so that it continues to update automatically.
      metric_.on("change.linechart-" + id, function(start, stop) {
        change(), focus();
        if (ready) metric_.on("change.linechart-" + id, cubism_identity);
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

  linechart.mode = function(_) {
    if (!arguments.length) return mode;
    mode = _ + "";
    return linechart;
  };

  linechart.height = function(_) {
    if (!arguments.length) return height;
    height = +_;
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

  linechart.extent = function(_) {
    if (!arguments.length) return extent;
    extent = _;
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

  return linechart;
};
