CONTENT_SRC_DIR?=$(SRC_DIR)/content
CONTENT_BUILD_DIR?=$(BUILD_DIR)/content

$(CONTENT_BUILD_DIR): $(shell find $(CONTENT_SRC_DIR) -type f -name \*.ts )
	rm -R $@ || true 
	cp -R -u $(CONTENT_SRC_DIR) $@
	$(WMLC) $@
	$(TSC) --project $@
