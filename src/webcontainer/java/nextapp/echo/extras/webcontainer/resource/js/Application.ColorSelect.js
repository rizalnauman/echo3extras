/**
 * @class ColorSelect component.
 * @base EchoApp.Component
 */
ExtrasApp.ColorSelect = EchoCore.extend(EchoApp.Component, {
    
    global: {
        DEFAULT_VALUE_WIDTH: new EchoApp.Extent(150),
        DEFAULT_SATURATION_HEIGHT: new EchoApp.Extent(150),
        DEFAULT_HUE_WIDTH: new EchoApp.Extent(20)
    },
    
    globalInitialize: function() {
        EchoApp.ComponentFactory.registerType("ExtrasApp.ColorSelect", this);
    },
    
    componentType: "ExtrasApp.ColorSelect"
});