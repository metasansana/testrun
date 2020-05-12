BACKGROUND_SRC_DIR?=$(SRC_DIR)/background
BACKGROUND_BUILD_DIR?=$(BUILD_DIR)/background

$(BACKGROUND_BUILD_DIR): $(shell find $(BACKGROUND_SRC_DIR) -type f -name \*.ts )
	rm -R $@ || true 
	cp -R -u $(BACKGROUND_SRC_DIR) $@
	$(WMLC) $@
	$(TSC) --project $@
