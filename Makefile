DEBUG?=no
UGLIFY?=./node_modules/.bin/uglifyjs
BROWSERIFY?=./node_modules/.bin/browserify
LESSC?=./node_modules/.bin/lessc
CLEANCSS?=./node_modules/.bin/cleancss
TSC?=./node_modules/.bin/tsc
WMLC?=./node_modules/.bin/wmlc
JS_VARS:=./node_modules/@quenk/wml-widgets/lib/classNames.js
COMPRESS:=$(if $(findstring yes,$(DEBUG)),,|$(UGLIFY))

.DELETE_ON_ERROR:

./: public test
	touch $@

public: public/testrun.js public/testrun.css
	touch $@

public/testrun.js: lib
	$(BROWSERIFY) lib/main.js $(COMPRESS) > $@

public/testrun.css: $(shell find src -type f -name \*.less)
	$(LESSC) $(if $(findstring yes,$(DEBUG)),--source-map-less-inline,)  \
	--js-vars=$(JS_VARS) src/main.less | $(CLEANCSS) > $@

lib: $(shell find src -type f -name \*.ts -o -name \*.wml)
	rm -R $@ || true 
	cp -R -u src $@
	$(WMLC) $@
	$(TSC) --project $@

	$(foreach script,$(shell find $@/scripts/page -name \*_bundle.js),\
	$(BROWSERIFY) $(script) $(COMPRESS) > $(script)) && true

test: test/public test/build
	touch $@

test/public: test/build 
	$(eval FILES:=$(shell find test/build -name \*.js))
	$(foreach f,$(FILES),\
	  $(BROWSERIFY) $(f) > $@/$(notdir $(basename $(f))).js)
	touch $@

test/build: $(shell find test/src -type f)
	rm -R $@ || true 
	cp -R -u test/src $@
	$(TSC) --project $@

.PHONY: docs
docs: lib
	./node_modules/.bin/typedoc \
	--mode modules \
	--out $@ \
	--tsconfig lib/tsconfig.json \
	--excludeNotExported \
	--excludePrivate && \
	echo "" > docs/.nojekyll
