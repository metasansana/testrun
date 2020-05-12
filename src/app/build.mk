APP_PUBLIC_DIR:=$(SRC_DIR)/app/public
APP_SRC_DIR:=$(SRC_DIR)/app/src
APP_BUILD_DIR:=$(SRC_DIR)/app/build

$(SRC_DIR)/app: $(APP_PUBLIC_DIR)
	touch $@

$(APP_PUBLIC_DIR): $(APP_PUBLIC_DIR)/testrun.js $(APP_PUBLIC_DIR)/testrun.css
	touch $@

$(APP_PUBLIC_DIR)/testrun.js: $(APP_BUILD_DIR)
	$(BROWSERIFY) $(APP_BUILD_DIR)/main.js $(COMPRESS) > $@

$(APP_PUBLIC_DIR)/testrun.css: $(shell find $(APP_SRC_DIR) \
                               -type f -name \*.less)
	$(LESSC) $(if $(findstring yes,$(DEBUG)),--source-map-less-inline,) \
	--js-vars=$(JS_VARS) $(APP_SRC_DIR)/main.less | $(CLEANCSS) > $@

$(APP_BUILD_DIR): $(shell find $(APP_SRC_DIR) \
                        -type f -name \*.ts -o -name \*.wml)
	rm -R $@ || true 
	cp -R -u $(APP_SRC_DIR) $@
	$(WMLC) $@
	$(TSC) --project $@
