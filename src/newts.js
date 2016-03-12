cubism_contextPrototype.newts = function(host, user, password) {
  var source  = {},
      context = this,
      auth    = "Basic " + btoa(user + ":" + password);

  function find_resolution(step, interval) {
    if (step <= interval) {
      return interval;
    } else {
      return Math.floor(step / interval) * interval;
    }
  }

  function sampling(start, end, step, metric, values) {
    var sampled = [];

    for (i=start; i<=end; i+=step) {
      var sample = [];
      while (values.length && Math.ceil(values[0][0].timestamp / 1000) <= i) {
        v = values.shift().find(function (datapoint) {
          return datapoint.name == metric;
        }).value;
        sample.push((v >= Number.MAX_VALUE || v <= Number.MIN_VALUE) ? 0 : v);
      }

      var v;
      if (sample.length) {
        v = sample.reduce(function(a, b) { return a + b }) / sample.length;
      } else {
        v = (sampled.length) ? sampled[sampled.length-1] : 0;
      }
      sampled.push(v);
    }

    return sampled;
  }

  source.metric = function(metric) {
    return context.metric(function(start, stop, step, callback) {
      url = host + '/measurements/'+ metric.report +'/'+ metric.resource;
      resolution = find_resolution(step, metric.interval);
      d3.json(url +'?resolution='+ resolution +'ms&start='+ cubism_newtsFormatDate(start) +'&end='+ cubism_newtsFormatDate(stop))
        .header("Authorization", auth)
        .get(function (error, values) {
          if (error) return callback(new Error("unable to load report"));
          callback(null, sampling(cubism_newtsFormatDate(start),
            cubism_newtsFormatDate(stop), cubism_newtsFormatDate(step),
            metric.name, values));
      });
    }, metric.name);
  };

  source.toString = function() {
    return "newts";
  };

  return source;
}

function cubism_newtsParse(values, metric) {
  return values.map(function (timepoint) {
    return timepoint.find(function (datapoint) {
      return datapoint.name == metric;
    }).value;
  });
}

function cubism_newtsFormatDate(time) {
  return Math.ceil(time / 1000);
}
