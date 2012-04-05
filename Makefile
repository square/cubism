JS_TESTER = ./node_modules/vows/bin/vows
JS_COMPILER = ./node_modules/uglify-js/bin/uglifyjs

.PHONY: test

all: cubism.min.js package.json

cubism.js: \
	src/cubism.js \
	src/id.js \
	src/identity.js \
	src/option.js \
	src/source.js \
	src/metric.js \
	src/cube.js \
	src/graphite.js \
	src/context.js \
	src/horizon.js \
	src/comparison.js \
	src/axis.js \
	src/rule.js \
	Makefile

%.min.js: %.js Makefile
	@rm -f $@
	$(JS_COMPILER) < $< > $@

%.js:
	@rm -f $@
	@echo '(function(exports){' > $@
	cat $(filter %.js,$^) >> $@
	@echo '})(this);' >> $@
	@chmod a-w $@

package.json: cubism.js src/package.js
	@rm -f $@
	node src/package.js > $@
	@chmod a-w $@

clean:
	rm -f cubism.js cubism.min.js package.json

test: all
	@$(JS_TESTER)
