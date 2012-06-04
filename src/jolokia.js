cubism_contextPrototype.jolokia = function(url,opts) {
    var source = {},
        context = this,
        j4p = createAgent(url,opts),
        step = 5e3;                    // 5 seconds by default

    source.metric = function() {
        var values = [];
        // If the first argument is a function, this callback function is used for calculating the
        // value of a data point. The remaining arguments should be one or more Jolokia requests objects
        // and the callback function given will be called with as many response objects after each server query.
        // The callback function needs to return a single calculated numerical value
        var name;
        var argsLen = arguments.length;
        var options = {};

        // Create metric upfront so that it can be used in extraction functions. The name defaults to the mbean name
        // but can be given as first arguments

        if (typeof arguments[arguments.length - 1] == "string") {
            name = arguments[arguments.length - 1];
            argsLen = arguments.length - 1;
        }
        // Options can be given as an object
        if (typeof arguments[arguments.length - 1] == "object" && !arguments[arguments.length - 1].type) {
            options = arguments[arguments.length - 1];
            name = options.name;
            argsLen = arguments.length - 1;
        }
        if (!name && typeof arguments[0] != "function") {
            name = arguments[0].mbean;
        }
        var metric;
        if (options.delta) {
            // Use cubism metric chaining for calculating the difference value and keep care that the
            // metric keeps old values up to the delta value
            var absMetric = context.metric(mapValuesFunc(values,options.keepDelay || options.delta), name);
            var prevMetric = absMetric.shift(-options.delta);
            metric = absMetric.subtract(prevMetric);
            if (name) {
                metric.toString = function() { return name };
            }
        } else {
            metric =  context.metric(mapValuesFunc(values,options.keepDelay,context.width), name);
        }

        // If an extraction function is given, this can be used for fine grained manipulations of
        // the answer
        if (typeof arguments[0] == "function") {
            var func = arguments[0];
            var respFunc = function(resp) {
                var isError = false;
                for (var i = 0; i < arguments.length; i++) {
                    if (j4p.isError(arguments[i])) {
                        isError = true;
                        break;
                    }
                }
                values.unshift(
                    { time: Date.now(), value: isError ? NaN : func.apply(metric,arguments) }
                );
            };
            var args = [ respFunc ];
            for (var i = 1; i < argsLen; i++) {
                args.push(arguments[i]);
            }
            j4p.register.apply(j4p,args);
        } else {
            // Register the argument given directly as a Jolokia request. The request must return a single
            // numerical value
            var request = arguments[0];
            j4p.register(function(resp) {
                values.unshift({
                    time: Date.now(),
                    value: j4p.isError(resp) ? NaN : Number(resp.value)
                });
            },request);
        }

        return metric;
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

    // =======================================================================================
    // Private helper method

    // Create a new Jolokia agent or reuse a given one
    function createAgent(url,opts) {
        if (url instanceof Jolokia) {
            return url;
        } else {
            var args;
            if (typeof url == "string") {
                args = {url:url};
                if (opts) {
                    for (var key in opts) {
                        if (opts.hasOwnProperty(key)) {
                            args[key] = opts[key];
                        }
                    }
                }
            } else {
                args = url;
            }
            return new Jolokia(args);
        }
    }

    // Generate function which picks the requested values from the values
    // stored periodically by the Jolokia poller.
    function mapValuesFunc(values,keepDelay,width) {
        return function(cStart, cStop, cStep, callback) {
            cStart = +cStart;
            cStop = +cStop;
            var retVals = [],
                cTime = cStop,
                vLen = values.length,
                vIdx = 0,
                vStart = vLen > 0 ? values[vLen-1].time : undefined;

            if (!vLen || cStop < vStart) {
                // Nothing fetched yet or seeked interval doesn't overlap with stored values --> return only NaNs
                for (var t = cStart; t <= cStop; t += cStep) {
                    retVals.push(NaN);
                }
                return callback(null,retVals);
            }

            // Fill up wit NaN until we reach the first stored val
            while (cTime > values[0].time + cStep) {
                retVals.unshift(NaN);
                cTime -= cStep;
            }

            while (cTime >= cStart && cTime >= vStart) {
                // Count down stored values until we find the next best 'fit'
                // (equals or closest before the step-calculated ime)
                while (values[vIdx].time > cTime) {
                    vIdx++;
                }
                retVals.unshift(values[vIdx].value);
                cTime -= cStep;
            }

            // Finally prepend with 'NaN' for data not yet fetched
            while (cTime >= cStart) {
                retVals.unshift(NaN);
                cTime -= cStep;
            }

            // Remove older values
            if (vLen > width) {
                if (!keepDelay) {
                    values.length = width;
                } else {
                    var keepUntil = values[width].time - keepDelay,
                        i = width;
                    while (i < vLen && values[i].time > keepUntil) {
                        i++;
                    }
                    values.length = i;
                }
            }
            callback(null, retVals);
        }
    }
};

