  cubism_contextPrototype.opentsdb = function(config) {
    var url = config.url;
    var source = {},
    context = this;

    source.metric = function(metricInfo) {
      var hostName = metricInfo.hostName,
      metricName = metricInfo.metricName,
      rate = metricInfo.rate ? 'rate:' : '',
      tags = metricInfo.tags ? metricInfo.tags : '';
      return context.metric(function(start, stop, step, callback) {
        d3.json(url + '?start=' + cubism_opentsdbFormatDate(start) +
                '&stop=' + cubism_opentsdbFormatDate(stop) +
                '&m=sum:' + cubism_opentsdbFormatDate(step) + 's-avg-none:' +
                rate + metricName + '%7Bhost=' + hostName + tags + '%7D',
                function(result) {
                  if( !result ) {
                    return callback(new Error("Unable to fetch opentsdb data"));
                  }
                  callback(null, Object.keys(result[0].dps).map(function(key) {
                    return result[0].dps[key];
                  }));
                });
      }, hostName + ':' + metricName + ':' + tags);
    }
    source.toString = function() {
      return 'opentsdb';
    };

    return source;
  };

  var cubism_opentsdbFormatDate = function(time) {
    return Math.floor(time/1000);
  }
