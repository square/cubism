/* librato (http://dev.librato.com/v1/post/metrics) source
 * If you want to see an example of how to use this source, check: https://gist.github.com/drio/5792680
 */
cubism_contextPrototype.librato = function(user, token) {
  var source      = {},
      context     = this;
      auth_string = "Basic " + btoa(user + ":" + token);
      avail_rsts  = [ 1, 60, 900, 3600 ];

  /* Given a step, find the best librato resolution to use.
   *
   * Example:
   *
   * (s) : cubism step
   *
   * avail_rsts   1 --------------- 60 --------------- 900 ---------------- 3600
   *                                |    (s)            |
   *                                |                   |
   *                              [low_res             top_res]
   *
   * return: low_res (60)
   */
  function find_ideal_librato_resolution(step) {
    var highest_res = avail_rsts[0],
        lowest_res  = avail_rsts[avail_rsts.length]; // high and lowest available resolution from librato

    /* If step is outside the highest or lowest librato resolution, pick them and we are done */
    if (step >= lowest_res)
      return lowest_res;

    if (step <= highest_res)
      return highest_res;

    /* If not, find in what resolution interval the step lands. */
    var iof, top_res, i;
    for (i=step; i<=lowest_res; i++) {
      iof = avail_rsts.indexOf(i);
      if (iof > -1) {
        top_res = avail_rsts[iof];
        break;
      }
    }

    var low_res;
    for (i=step; i>=highest_res; i--) {
      iof = avail_rsts.indexOf(i);
      if (iof > -1) {
        low_res = avail_rsts[iof];
        break;
      }
    }

    /* What's the closest librato resolution given the step ? */
    return ((top_res-step) < (step-low_res)) ? top_res : low_res;
  }

  function find_librato_resolution(sdate, edate, step) {
    var i_size      = edate - sdate,                 // interval size
        month       = 2419200,
        week        = 604800,
        two_days    = 172800,
        ideal_res;

    if (i_size > month)
      return 3600;

    ideal_res = find_ideal_librato_resolution(step);

    /*
     * Now we have the ideal resolution, but due to the retention policies at librato, maybe we have
     * to use a higher resolution.
     * http://support.metrics.librato.com/knowledgebase/articles/66838-understanding-metrics-roll-ups-retention-and-grap
     */
    if (i_size > week && ideal_res < 900)
      return 900;
    else if (i_size > two_days && ideal_res < 60)
      return 60;
    else
      return ideal_res;
  }

  /* All the logic to query the librato API is here */
  var librato_request = function(composite) {
    var url_prefix  = "https://metrics-api.librato.com/v1/metrics";

    function make_url(sdate, edate, step) {
      var params    = "compose="     + composite +
                      "&start_time=" + sdate     +
                      "&end_time="   + edate     +
                      "&resolution=" + find_librato_resolution(sdate, edate, step);
      return url_prefix + "?" + params;
    }

    /*
     * We are most likely not going to get the same number of measurements
     * cubism expects for a particular context: We have to perform down/up
     * sampling
     */
    function down_up_sampling(isdate, iedate, step, librato_mm) {
      var av = [];

      for (i=isdate; i<=iedate; i+=step) {
        var int_mes = [];
        while (librato_mm.length && librato_mm[0].measure_time <= i) {
          int_mes.push(librato_mm.shift().value);
        }

        var v;
        if (int_mes.length) { /* Compute the average */
          v = int_mes.reduce(function(a, b) { return a + b }) / int_mes.length;
        } else { /* No librato values on interval */
          v = (av.length) ? av[av.length-1] : 0;
        }
        av.push(v);
      }

      return av;
    }

    request = {};

    request.fire = function(isdate, iedate, step, callback_done) {
      var a_values = []; /* Store partial values from librato */

      /*
       * Librato has a limit in the number of measurements we get back in a request (100).
       * We recursively perform requests to the API to ensure we have all the data points
       * for the interval we are working on.
       */
      function actual_request(full_url) {
        d3.json(full_url)
          .header("X-Requested-With", "XMLHttpRequest")
          .header("Authorization", auth_string)
          .header("Librato-User-Agent", 'cubism/' + cubism.version)
          .get(function (error, data) { /* Callback; data available */
            if (!error) {
              if (data.measurements.length === 0) {
                return
              }
              data.measurements[0].series.forEach(function(o) { a_values.push(o); });

              var still_more_values = 'query' in data && 'next_time' in data.query;
              if (still_more_values) {
                actual_request(make_url(data.query.next_time, iedate, step));
              } else {
                var a_adjusted = down_up_sampling(isdate, iedate, step, a_values);
                callback_done(a_adjusted);
              }
            }
          });
      }

      actual_request(make_url(isdate, iedate, step));
    };

    return request;
  };

  /*
   * The user will use this method to create a cubism source (librato in this case)
   * and call .metric() as necessary to create metrics.
   */
  source.metric = function(m_composite) {
    return context.metric(function(start, stop, step, callback) {
      /* All the librato logic is here; .fire() retrieves the metrics' data */
      librato_request(m_composite)
        .fire(cubism_libratoFormatDate(start),
              cubism_libratoFormatDate(stop),
              cubism_libratoFormatDate(step),
              function(a_values) { callback(null, a_values); });

      }, m_composite += "");
    };

  /* This is not used when the source is librato */
  source.toString = function() {
    return "librato";
  };

  return source;
};

var cubism_libratoFormatDate = function(time) {
  return Math.floor(time / 1000);
};
