NODE_SRC_DIR?=$(SRC_DIR)/node
NODE_BUILD_DIR?=$(BUILD_DIR)/node

$(NODE_BUILD_DIR): $(shell find $(NODE_SRC_DIR) -type f -name \*.ts )
	rm -R $@ || true 
	cp -R -u $(NODE_SRC_DIR) $@
	$(WMLC) $@
	$(TSC) --project $@
	chmod +x $@/main.js
