cubism_contextPrototype.jolokia = function(url,opts) {
    opts = opts || {};
    var source = {},
        j4p = new Jolokia({url: url}), // client stub for accessing jolokia
        step = 5e3,                    // 5 seconds by default
        id = 0,
        data = {};

    source.metric = function(request) {
        id++;
        var values = data[id];
        if (!values) {
            data[id] = values = [];
        }
        // If the first argument is a function, this callback function is used for calculating the
        // value of a datapoint. The remaining arguments should be one or more Jolokia requests objects
        // and the callback function given will be called with as many response objects after each server query.
        // The callback function needs to return a single calculated numerical value
        if (typeof request == 'function') {

            var respFunc = function(resp) {
                var isError = false;
                for (var i = 0; i < arguments.length; i++) {
                    if (j4p.isError(arguments[i])) {
                        isError = true;
                        break;
                    }
                }
                values.unshift(
                    isError ?
                    { time: Date.now(), value: NaN } :
                    { time: resp.timestamp * 1000, value: request.apply(j4p,arguments) }
                );
            };
            var args = [ respFunc ];
            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            j4p.register.apply(j4p,args);
        } else {
            // Register the argument given directly as a Jolokia request. The request must return a single
            // numerical value
            j4p.register(function(resp) {
                values.unshift({
                    time: resp.timestamp ? resp.timestamp * 1000 : Date.now(),
                    value: j4p.isError(resp) ? NaN : Number(resp.value)
                });
            },request);
        }
        return context.metric(function(start, stop, step, callback) {
            start = +start;
            stop = +stop;
            var retVals = [],
                cTime = stop,
                len = values.length,
                cVal = values[0],
                idx = 0;

            if (!len) {
                // Nothing fetched yet
                for (var t = start; t <= stop; t += step) {
                    retVals.push(NaN);
                }
                return callback(null,retVals);
            }
            // Fill up wit NaN until we reach the first stored val
            while (cVal.time < cTime) {
                retVals.unshift(NaN);
                cTime -= step;
            }
            // Now fill up the data
            while (cTime >= start && idx < len) {
                if (cVal.time > cTime && idx < len - 1) {
                    cVal = values[++idx];
                }
                retVals.unshift(cVal.value);
                cTime -= step;
            }
            // Finally prepend with 'NaN' for data not yet fetched
            while (cTime >= start) {
                retVals.unshift(NaN);
                cTime -= step;
            }

            // Remove older values
            if (idx < len - 1) {
                values.length = idx+1;
            }

            callback(null, retVals);
        }, request.mbean);
    };

    // Start up fetching of values in the background
    source.start = function(newStep) {
        newStep = newStep || step;
        j4p.start(newStep);
    };

    // Stop fetching of values in the backgorund
    source.stop = j4p.stop;

    // Check whether the scheduler is running
    source.isRunning = j4p.isRunning;

    // Startup poller which will call the agent periodically
    return source;

};