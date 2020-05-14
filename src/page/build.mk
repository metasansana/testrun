PAGE_SRC_DIR:=$(SRC_DIR)/page
PAGE_BUILD_DIR:=$(BUILD_DIR)/page

$(PAGE_BUILD_DIR): $(shell find $(PAGE_SRC_DIR) -type f -name \*.ts -o -name \*.wml)
	rm -R $@ || true 
	cp -R -u $(PAGE_SRC_DIR) $@
	$(WMLC) $@
	$(TSC) --project $@
