// FIXME handle enabled/disabled state

/**
 * Component rendering peer: AccordionPane
 */
ExtrasRender.ComponentSync.AccordionPane = EchoCore.extend(EchoRender.ComponentSync, {

    global: {
        _paneInsets: new EchoApp.Insets(0),
        _defaultTabBackground: new EchoApp.Color("#cfcfcf"),
        _defaultTabBorder: new EchoApp.Border("1px outset #cfcfcf"),
        _defaultTabForeground: new EchoApp.Color("#000000"),
        _defaultTabHeight: new EchoApp.Extent(20),
        _defaultTabInsets: new EchoApp.Insets(2, 5),
        _defaultTabContentInsets: this._paneInsets
    },
    
    globalInitialize: function() {
        EchoRender.registerPeer("ExtrasApp.AccordionPane", this);
    },
       
    initialize: function() {
    	this._paneDivElement = null;
    	this._activeTabId = null;
    	this._tabs = new Array();
    	this._rotation = null;
        this._animationEnabled = true;
        this._animationTime = 350;
        this._animationSleepInterval = 1;
    },
    
    renderAdd: function(update, parentElement) {
    	this._activeTabId = this.component.getProperty("activeTab");
    	
        this._paneDivElement = this._render();
        
        var componentCount = this.component.getComponentCount();
        for (var i = 0; i < componentCount; ++i) {
            var child = this.component.getComponent(i);
    		var tab = new ExtrasRender.ComponentSync.AccordionPane.Tab(child, this);
    	    this._tabs.push(tab);
    	    tab._render(this.client, update);
    	    this._paneDivElement.appendChild(tab._tabDivElement);
    	    this._paneDivElement.appendChild(tab._contentDivElement);
        }
        
        this._redrawTabs();
        
        parentElement.appendChild(this._paneDivElement);
    },
    
    renderDisplay: function() {
        for (var i = 0; i < this._tabs.length; ++i) {
            this._tabs[i]._renderDisplay();
        }
    },

    renderUpdate: function(update) {
        // FIXME partial update / lazy rendering
        var element = this._paneDivElement;
        var containerElement = element.parentNode;
        EchoRender.renderComponentDispose(update, update.parent);
        containerElement.removeChild(element);
        this.renderAdd(update, containerElement);
        return true;
    },

    renderDispose: function(update) {
    	if (this._rotation) {
    		this._rotation._dispose();
    	}
    	this._activeTabId = null;
    	for (var i = 0; i < this._tabs.length; i++) {
    		this._tabs[i]._dispose();
    	}
    	this._tabs = new Array();
    	this._paneDivElement.id = "";
    	this._paneDivElement = null;
    },
    
    _render: function() {
        var paneDivElement = document.createElement("div");
        paneDivElement.id = this.component.renderId;
        paneDivElement.style.position = "absolute";
        paneDivElement.style.overflow = "hidden";
        paneDivElement.style.width = "100%";
        paneDivElement.style.height = "100%";
        EchoAppRender.Color.renderFB(this.component, paneDivElement);
        EchoAppRender.Font.renderDefault(this.component, paneDivElement);
        return paneDivElement;
    },
    
    /**
     * Selects a specific tab.
     * 
     * @param tabId {String} the id of the tab to select
     */
    _selectTab: function(tabId) {
        if (tabId == this._activeTabId) {
        	return;
        }
        this.component.setProperty("activeTab", tabId);
        
        var oldTabId = this._activeTabId;
        this._activeTabId = tabId;
        if (oldTabId != null && this._animationEnabled) {
            this._rotateTabs(oldTabId, tabId);
        } else {
            this._redrawTabs();
        }
    },
    
    /**
     * Removes a tab from an AccordionPane.
     *
     * @param tab the tab to remove
     */
    _removeTab: function(tab) {
        var tabIndex = EchoCore.Arrays.indexOf(this._tabs, tab);
        this._tabs.splice(tabIndex, 1);
    
        tab._tabDivElement.parentNode.removeChild(tab._tabDivElement);
        tab._contentDivElement.parentNode.removeChild(tab._contentDivElement);
    	tab._dispose();
    },
    
    /**
     * Redraws tabs in the appropriate positions, exposing the content of the 
     * selected tab.
     */
    _redrawTabs: function() {
        if (this._rotation) {
            this._rotation._cancel();
        }
        
        if (this._activeTabId == null || this._getTabById(this._activeTabId) == null) {
    		if (this._tabs.length > 0) {
    			this._activeTabId = this._tabs[0]._childComponent.renderId;
        	} else {
                this._activeTabId = null;
        	}
        }
    	
        var selectionPassed = false;
        var tabHeight = this._calculateTabHeight();
        for (var i = 0; i < this._tabs.length; ++i) {
            var tab = this._tabs[i];
            var tabDivElement = tab._tabDivElement;
            var contentDivElement = tab._contentDivElement;
            
            if (selectionPassed) {
                tabDivElement.style.top = "";
                tabDivElement.style.bottom = (tabHeight * (this._tabs.length - i - 1)) + "px";
            } else {
                tabDivElement.style.bottom = "";
                tabDivElement.style.top = (tabHeight * i) + "px";
            }
    
            contentDivElement.style.height = "";
            
            if (this._activeTabId == tab._childComponent.renderId) {
                selectionPassed = true;
                contentDivElement.style.display = "block";
                contentDivElement.style.top = (tabHeight * (i + 1)) + "px";
                var bottomPx = tabHeight * (this._tabs.length - i - 1);
                contentDivElement.style.bottom = bottomPx + "px";
            } else {
                contentDivElement.style.display = "none";
            }
        }
    },
    
    /**
     * "Rotates" the AccordionPane to display the specified tab.
     *
     * @param oldTabId {String} the currently displayed tab id
     * @param newTabId {String} the id of the tab that will be displayed
     */
    _rotateTabs: function(oldTabId, newTabId) {
        var oldTab = this._getTabById(oldTabId);
        if (oldTab == null) {
            // Old tab has been removed.
            this._redrawTabs();
            return;
        }
        if (this._rotation) {
            // Rotation was already in progress, cancel
            this._rotation._cancel();
            this._redrawTabs();
        } else {
            // Start new rotation.
    	    var newTab = this._getTabById(newTabId);
            this._rotation = new ExtrasRender.ComponentSync.AccordionPane.Rotation(this, oldTab, newTab);
        }
    },
    
    /**
     * Retrieves the tab instance with the specified tab id.
     * 
     * @param tabId the tab id
     * @return the tab, or null if no tab is present with the specified id
     */
    _getTabById: function(tabId) {
        for (var i = 0; i < this._tabs.length; ++i) {
            var tab = this._tabs[i];
            if (tab._childComponent.renderId == tabId) {
                return tab;
            }
        }
        return null;
    },
    
    _getTabBackground: function() {
    	var background = this.component.getRenderProperty("tabBackground");
    	return background ? background : ExtrasRender.ComponentSync.AccordionPane._defaultTabBackground;
    },
    
    _getTabBorder: function() {
    	var border = this.component.getRenderProperty("tabBorder");
    	return border ? border : ExtrasRender.ComponentSync.AccordionPane._defaultTabBorder;
    },
    
    _getTabInsets: function() {
    	var insets = this.component.getRenderProperty("tabInsets");
    	return insets ? insets : ExtrasRender.ComponentSync.AccordionPane._defaultTabInsets;
    },
    
    /**
     * @return the tab height in pixels
     * @type {Number}
     */
    _calculateTabHeight: function() {
    	var height = ExtrasRender.ComponentSync.AccordionPane._defaultTabHeight;
    	var insets = this._getTabInsets();
    	var border = this._getTabBorder();
        return height.value + insets.top.value + insets.bottom.value + (border.size.value * 2);
    }
});

ExtrasRender.ComponentSync.AccordionPane.Tab = EchoCore.extend({
    
    initialize: function(childComponent, parent) {
    	this._childComponent = childComponent;
    	this._parent = parent;
    	this._rendered = false;
    	this._tabDivElement = null;
    	this._contentDivElement = null;
    },
    
    _render: function(client, update) {
        this._tabDivElement = document.createElement("div");
        this._tabDivElement.id = this._parent.component.renderId + "_tab_" + this._childComponent.renderId;
        this._tabDivElement.style.cursor = "pointer";
        this._tabDivElement.style.height = ExtrasRender.ComponentSync.AccordionPane._defaultTabHeight;
        EchoAppRender.Insets.renderPixel(this._parent._getTabInsets(), this._tabDivElement, "padding");
        this._tabDivElement.style.position = "absolute";
        this._tabDivElement.style.left = "0px";
        this._tabDivElement.style.right = "0px";
        this._tabDivElement.style.overflow = "hidden";
        this._tabDivElement.appendChild(document.createTextNode(this._getTitle()));
    
        this._contentDivElement = document.createElement("div");
        this._contentDivElement.id = this._parent.component.renderId + "_content_" + this._childComponent.renderId;
        this._contentDivElement.style.display = "none";
        this._contentDivElement.style.position = "absolute";
        this._contentDivElement.style.left = "0px";
        this._contentDivElement.style.right = "0px";
        EchoAppRender.Insets.renderPixel(this._getContentInsets(), this._contentDivElement, "padding");
        this._contentDivElement.style.overflow = "auto";
    
    	EchoRender.renderComponentAdd(update, this._childComponent, this._contentDivElement);
    	
        this._highlight(false);
        this._addEventListeners();
    },
    
    _renderDisplay: function() {
        EchoWebCore.VirtualPosition.redraw(this._tabDivElement);
        EchoWebCore.VirtualPosition.redraw(this._contentDivElement);
    },
    
    _dispose: function() {
    	EchoWebCore.EventProcessor.removeAll(this._tabDivElement);
    	
    	this._parent = null;
    	this._childComponent = null;
    	this._tabDivElement.id = "";
    	this._tabDivElement = null;
    	this._contentDivElement.id = "";
    	this._contentDivElement = null;
    },
    
    _highlight: function(state) {
        var tabDivElement = this._tabDivElement;
        if (state) {
            var background = this._parent.component.getRenderProperty("tabRolloverBackground");
            if (!background) {
            	background = ExtrasRender.Color.adjustIntensity(this._parent._getTabBackground());
            }
            EchoAppRender.Color.render(background, tabDivElement, "backgroundColor");
            var backgroundImage = this._parent.component.getRenderProperty("tabRolloverBackgroundImage");
            if (backgroundImage) {
    	        tabDivElement.style.backgroundImage = "";
    	        tabDivElement.style.backgroundPosition = "";
    	        tabDivElement.style.backgroundRepeat = "";
    	        EchoAppRender.FillImage.render(backgroundImage, tabDivElement, null);
            }
            var foreground = this._parent.component.getRenderProperty("tabRolloverForeground");
            if (foreground) {
            	EchoAppRender.Color.render(foreground, tabDivElement, "color");
            }
            var border = this._parent.component.getRenderProperty("tabRolloverBorder");
            if (!border) {
            	var defaultBorder = this._parent._getTabBorder();
            	border = new EchoApp.Border(defaultBorder.size, defaultBorder.style, ExtrasRender.Color.adjustIntensity(defaultBorder.color));
            }
    	    EchoAppRender.Border.renderSide(border, tabDivElement, "borderTop");
    	    EchoAppRender.Border.renderSide(border, tabDivElement, "borderBottom");
        } else {
    	    var border = this._parent._getTabBorder();
    	    EchoAppRender.Border.renderSide(border, tabDivElement, "borderTop");
    	    EchoAppRender.Border.renderSide(border, tabDivElement, "borderBottom");
    	    EchoAppRender.Color.render(this._parent._getTabBackground(), tabDivElement, "backgroundColor");
    	    EchoAppRender.Color.renderComponentProperty(this._parent.component, "tabForeground", ExtrasRender.ComponentSync.AccordionPane._defaultTabForeground, tabDivElement, "color");
            tabDivElement.style.backgroundImage = "";
            tabDivElement.style.backgroundPosition = "";
            tabDivElement.style.backgroundRepeat = "";
    	    EchoAppRender.FillImage.renderComponentProperty(this._parent.component, "tabBackgroundImage", null, tabDivElement);
        }
    },
    
    _addEventListeners: function() {
        EchoWebCore.EventProcessor.add(this._tabDivElement, "click", new EchoCore.MethodRef(this, this._processClick), false);
        if (this._parent.component.getRenderProperty("tabRolloverEnabled", true)) {
    	    EchoWebCore.EventProcessor.add(this._tabDivElement, "mouseover", new EchoCore.MethodRef(this, this._processEnter), false);
    	    EchoWebCore.EventProcessor.add(this._tabDivElement, "mouseout", new EchoCore.MethodRef(this, this._processExit), false);
        }
    	EchoWebCore.EventProcessor.addSelectionDenialListener(this._tabDivElement);
    },
    
    _getTitle: function() {
    	var layoutData = this._childComponent.getRenderProperty("layoutData");
    	return layoutData ? layoutData.getProperty("title") : null;
    },
    
    _getContentInsets: function() {
        if (this._childComponent.pane) {
    		return ExtrasRender.ComponentSync.AccordionPane._paneInsets;
    	} else {
    		var insets = this._parent.component.getRenderProperty("defaultContentInsets");
    		return insets ? insets : ExtrasRender.ComponentSync.AccordionPane._defaultTabContentInsets;
    	}
    },
    
    _processClick: function(e) {
        if (!this._parent.component.isActive()) {
            return;
        }
        this._parent._selectTab(this._childComponent.renderId);
        // FIXME notify server
    },
    
    _processEnter: function(e) {
        if (!this._parent.component.isActive()) {
            return;
        }
        this._highlight(true);
    },
    
    _processExit: function(e) {
        if (!this._parent.component.isActive()) {
            return;
        }
        this._highlight(false);
    }
});

/**
 * Object to manage rotation animation of an AccordionPane.
 * These objects are created and assigned to a specific AccordionPane
 * while it is animating.
 *
 * Creates and starts a new Rotation.  This constructor will store the
 * created Rotation object in the specified AccordionPane's 'rotation'
 * property.
 *
 * @param parent the AccordionPane to rotate
 * @param oldTab the old (current) tab
 * @param newTab the new tab to display
 */
ExtrasRender.ComponentSync.AccordionPane.Rotation = EchoCore.extend({

    global: {
    
        /**
         * Contains mappings from AccordionPane render ids to Rotation objects.
         * 
         * @type {Object}
         */
        idToRotation: {},

        /**
         * Static method invoked by window.setTimeout which invokes appropriate Rotation instance method.
         *
         * @param renderId the render id of the Rotation's AccordionPane to step
         */
        _animationStep: function(renderId) {
            var rotation = ExtrasRender.ComponentSync.AccordionPane.Rotation._idToRotation[renderId];
            if (rotation) {
                rotation._animationStep();
            }
        }
    },
    
    initialize: function(parent, oldTab, newTab) {
    	this._parent = parent;
        this._oldTab = oldTab;
        this._newTab = newTab;
        
        this._oldTabContentInsets = this._oldTab._getContentInsets();
        this._newTabContentInsets = this._newTab._getContentInsets();
        
        this._animationStartTime = new Date().getTime();
        this._animationEndTime = this._animationStartTime + this._parent._animationTime;
        
        this._tabHeight = this._parent._calculateTabHeight();
        
        this._rotatingTabs = new Array();
        
        this._animationStepIndex = 0;
        
        this._oldTabIndex = EchoCore.Arrays.indexOf(this._parent._tabs, this._oldTab);
        this._newTabIndex = EchoCore.Arrays.indexOf(this._parent._tabs, this._newTab);
        this._directionDown = this._newTabIndex < this._oldTabIndex;
        
        if (this._directionDown) {
            // Tabs are sliding down (a tab on the top has been selected).
            for (var i = this._oldTabIndex; i > this._newTabIndex; --i) {
                this._rotatingTabs.push(this._parent._tabs[i]);
            }
        } else {
            // Tabs are sliding up (a tab on the bottom has been selected).
            for (var i = this._oldTabIndex + 1; i <= this._newTabIndex; ++i) {
                this._rotatingTabs.push(this._parent._tabs[i]);
            }
        }
        
        this._regionHeight = this._newTab._tabDivElement.parentNode.offsetHeight;
        
        if (this._directionDown) {
            // Numbers of tabs above that will not be moving.
            this._numberOfTabsAbove = this._newTabIndex + 1;
            
            // Number of tabs below that will not be moving.
            this._numberOfTabsBelow = this._parent._tabs.length - 1 - this._newTabIndex;
            
            // Initial top position of topmost moving tab.
            this._startTopPosition = this._tabHeight * this._numberOfTabsAbove;
            
            // Final top position of topmost moving tab.
            this._endTopPosition = this._regionHeight - this._tabHeight * (this._numberOfTabsBelow);
            
            // Number of pixels across which animation will occur.
            this._animationDistance = this._endTopPosition - this._startTopPosition;
        
        } else {
            // Numbers of tabs above that will not be moving.
            this._numberOfTabsAbove = this._newTabIndex;
        
            // Numbers of tabs below that will not be moving.
            this._numberOfTabsBelow = this._parent._tabs.length - 1 - this._newTabIndex;
    
            // Initial bottom position of bottommost moving tab.
            this._startBottomPosition = this._tabHeight * this._numberOfTabsBelow;
    
            // Final bottom position of bottommost moving tab.
            this._endBottomPosition = this._regionHeight - this._tabHeight * (this._numberOfTabsAbove + 1);
            
            // Number of pixels across which animation will occur.
            this._animationDistance = this._endBottomPosition - this._startBottomPosition;
        }
        
        this._overflowUpdate();
        this._animationStep();
    },
    
    /**
     * Renders the next step of the rotation animation.
     * Queues subsequent frame of animation via Window.setTimeout() call to self.
     */
    _animationStep: function() {
        var currentTime = new Date().getTime();
        
        if (currentTime < this._animationEndTime) {
            // Number of pixels (from 0) to step current current frame.
            
            var stepFactor = (currentTime - this._animationStartTime) / this._parent._animationTime;
            var stepPosition = Math.round(stepFactor * this._animationDistance);
    
            if (this._directionDown) {
    
                // Move each moving tab to next step position.
                for (var i = 0; i < this._rotatingTabs.length; ++i) {
                    var newPosition = stepPosition + this._startTopPosition + (this._tabHeight * (this._rotatingTabs.length - i - 1));
                    this._rotatingTabs[i]._tabDivElement.style.top = newPosition + "px";
                }
                
                // Adjust height of expanding new tab content to fill expanding space.
                var newContentHeight = stepPosition - this._oldTabContentInsets.top.value - this._oldTabContentInsets.bottom.value;
                if (newContentHeight < 0) {
                    newContentHeight = 0;
                }
                this._newTab._contentDivElement.style.height = newContentHeight + "px";
                
                // On first frame, display new tab content.
                if (this._animationStepIndex == 0) {
                    this._oldTab._contentDivElement.style.bottom = "";
                    this._newTab._contentDivElement.style.display = "block";
                    this._newTab._contentDivElement.style.top = (this._numberOfTabsAbove * this._tabHeight) + "px";
                }
                
                // Move top of old content downward.
                var oldTop = stepPosition + this._startTopPosition + (this._rotatingTabs.length * this._tabHeight);
                this._oldTab._contentDivElement.style.top = oldTop + "px";
                
                // Reduce height of contracting old tab content to fit within contracting space.
                var oldContentHeight = this._regionHeight - oldTop - ((this._numberOfTabsBelow - 1) * this._tabHeight) 
                        - this._oldTabContentInsets.top.value - this._oldTabContentInsets.bottom.value;
                if (oldContentHeight < 0) {
                    oldContentHeight = 0;
                }
                this._oldTab._contentDivElement.style.height = oldContentHeight + "px";
            } else {
                // Move each moving tab to next step position.
                for (var i = 0; i < this._rotatingTabs.length; ++i) {
                    var newPosition = stepPosition + this._startBottomPosition + (this._tabHeight * (this._rotatingTabs.length - i - 1));
                    this._rotatingTabs[i]._tabDivElement.style.bottom = newPosition + "px";
                }
                
                // On first frame, display new tab content.
                if (this._animationStepIndex == 0) {
                    this._oldTab._contentDivElement.style.bottom = "";
                    this._newTab._contentDivElement.style.top = "";
                    this._newTab._contentDivElement.style.bottom = (this._numberOfTabsBelow * this._tabHeight) + "px";
                    this._newTab._contentDivElement.style.height = "0px";
                    this._newTab._contentDivElement.style.display = "block";
                }
                
                // Reduce height of contracting old tab content to fit within contracting space.
                var oldContentHeight = this._regionHeight - stepPosition 
                        - ((this._numberOfTabsAbove + this._numberOfTabsBelow + 1) * this._tabHeight)
                        - this._oldTabContentInsets.top.value - this._oldTabContentInsets.bottom.value;
                if (oldContentHeight < 0) {
                    oldContentHeight = 0;
                }
                this._oldTab._contentDivElement.style.height = oldContentHeight + "px";
                
                // Increase height of expanding tab content to fit within expanding space.
                var newContentHeight = stepPosition - this._newTabContentInsets.top.value - this._newTabContentInsets.bottom.value;
                if (newContentHeight < 0) {
                    newContentHeight = 0;
                };
                this._newTab._contentDivElement.style.height = newContentHeight + "px";
            }
            
            ++this._animationStepIndex;
        
            // Continue Rotation.
            var renderId = this._parent.component.renderId;
            ExtrasRender.ComponentSync.AccordionPane.Rotation._idToRotation[renderId] = this;
            window.setTimeout("ExtrasRender.ComponentSync.AccordionPane.Rotation._animationStep(\"" + renderId + "\")", 
                    this._parent._animationSleepInterval);
        } else {
            // Complete Rotation.
            this._overflowRestore();
            var parent = this._parent;
            this._dispose();
            parent._redrawTabs();
        }
    },
    
    _overflowUpdate: function() {
        if (this._oldTab._contentDivElement.style.overflow) {
            this._oldContentOverflow = this._oldTab._contentDivElement.style.overflow; 
        }
        if (this._newTab._contentDivElement.style.overflow) {
            this._newContentOverflow = this._newTab._contentDivElement.style.overflow; 
        }
    
        this._oldTab._contentDivElement.style.overflow = "hidden";
        this._newTab._contentDivElement.style.overflow = "hidden";
    },
    
    _overflowRestore: function() {
        this._oldTab._contentDivElement.style.overflow = this._oldContentOverflow ? this._oldContentOverflow : ""; 
        this._newTab._contentDivElement.style.overflow = this._newContentOverflow ? this._newContentOverflow : "";
    },
    
    _cancel: function() {
    	this._overflowRestore();
    	this._dispose();
    },
    
    _dispose: function() {
    	var renderId = this._parent.component.renderId;
    	delete ExtrasRender.ComponentSync.AccordionPane.Rotation._idToRotation[renderId];
    	this._parent._rotation = null;
    	this._parent = null;
    	this._oldTab = null;
    	this._newTab = null;
    	this._rotatingTabs = null;
    }
});