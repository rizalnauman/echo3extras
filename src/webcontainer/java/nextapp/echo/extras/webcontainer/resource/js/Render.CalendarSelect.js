/**
 * Component rendering peer: CalendarSelect
 */
ExtrasRender.ComponentSync.CalendarSelect = Core.extend(EchoRender.ComponentSync, {

    $static: {
        DEFAULT_FOREGROUND: new EchoApp.Color("#000000"),
        DEFAULT_BACKGROUND: new EchoApp.Color("#ffffff"),
        DEFAULT_BORDER: new EchoApp.Border("2px groove #5f5faf")
    },

    $load: function() {
        EchoRender.registerPeer("ExtrasApp.CalendarSelect", this);
    },
    
    _element: null,
    _monthSelect: null,
    _yearField: null,
    
    // FIXME temporary
    _icons: { },

    _rb: new Core.ResourceBundle({
        "DayOfWeek.0":     "Sunday",
        "DayOfWeek.1":     "Monday",
        "DayOfWeek.2":     "Tuesday",
        "DayOfWeek.3":     "Wednesday",
        "DayOfWeek.4":     "Thursday",
        "DayOfWeek.5":     "Friday",
        "DayOfWeek.6":     "Saturday",
        "Month.0":         "January",
        "Month.1":         "February",
        "Month.2":         "March",
        "Month.3":         "April",
        "Month.4":         "May",
        "Month.5":         "June",
        "Month.6":         "July",
        "Month.7":         "August",
        "Month.8":         "September",
        "Month.9":         "October",
        "Month.10":        "November",
        "Month.11":        "December",
        "FirstDayOfWeek":  "0"
    }),
    
    renderAdd: function(update, parentElement) {
        var i, j, tdElement, trElement;
        var dayOfWeekNameAbbreviationLength = parseInt(this.component.getRenderProperty("dayOfWeekNameAbbreviationLength", 2));
        var firstDayOfWeek = this._rb.get("FirstDayOfWeek");
        if (!firstDayOfWeek) {
            firstDayOfWeek = 0;
        }
    
        this._element = document.createElement("div");
        this._element.style.whiteSpace = "nowrap";
        
        this._monthSelect = document.createElement("select");
        for (var i = 0; i < 12; ++i) {
            var optionElement = document.createElement("option");
            optionElement.appendChild(document.createTextNode(this._rb.get("Month." + i)));
            this._monthSelect.appendChild(optionElement);
        }
        this._element.appendChild(this._monthSelect);
        
        this._element.appendChild(document.createTextNode(" "));
        
        var yearDecrementElement = document.createElement("span");
        yearDecrementElement.style.cursor = "pointer";
        if (this._icons.decrement) {
            var imgElement = document.createElement("img");
            imgElement.src = this._icons.decrement;
            yearDecrementElement.appendChild(imgElement);
        } else {
            yearDecrementElement.appendChild(document.createTextNode("<"));
        }
        this._element.appendChild(yearDecrementElement);
        
        this._yearField = document.createElement("input");
        this._yearField.type = "text";
        this._yearField.maxLength = 4;
        this._yearField.size = 5;
        this._element.appendChild(this._yearField);

        var yearIncrementElement = document.createElement("span");
        yearIncrementElement.style.cursor = "pointer";
        if (this._icons.increment) {
            var imgElement = document.createElement("img");
            imgElement.src = this._icons.increment;
            yearIncrementElement.appendChild(imgElement);
        } else {
            yearIncrementElement.appendChild(document.createTextNode(">"));
        }
        this._element.appendChild(yearIncrementElement);
        
        var tableElement = document.createElement("table");
        tableElement.style.borderCollapse = "collapse";
        tableElement.style.margin = "1px";
        EchoAppRender.Border.renderComponentProperty(this.component, "border", 
                ExtrasRender.ComponentSync.CalendarSelect.DEFAULT_BORDER, tableElement);
        EchoAppRender.Color.renderComponentProperty(this.component, "foreground",
                ExtrasRender.ComponentSync.CalendarSelect.DEFAULT_FOREGROUND, tableElement); 
        EchoAppRender.FillImage.renderComponentProperty(this.component, "backgroundImage", null, tableElement); 
        
        var tbodyElement = document.createElement("tbody");
        
        trElement = document.createElement("tr");
        for (j = 0; j < 7; ++j) {
            tdElement = document.createElement("td");
            var dayOfWeekName = this._rb.get("DayOfWeek." + ((firstDayOfWeek + j) % 7));
            if (dayOfWeekNameAbbreviationLength > 0) {
                dayOfWeekName = dayOfWeekName.substring(0, dayOfWeekNameAbbreviationLength);
            }
            tdElement.appendChild(document.createTextNode(dayOfWeekName));
            trElement.appendChild(tdElement);
        }
        tbodyElement.appendChild(trElement);
        
        for (i = 0; i < 6; ++i) {
            trElement = document.createElement("tr");
            for (j = 0; j < 7; ++j) {
                tdElement = document.createElement("td");
                trElement.appendChild(tdElement);
            }
            tbodyElement.appendChild(trElement);
        }
        
        tableElement.appendChild(tbodyElement);
        this._element.appendChild(tableElement);
        
        parentElement.appendChild(this._element);
    },
    
    renderDispose: function(update) { 
        this._element = null;
        this._monthSelect = null;
        this._yearField = null;
    },
    
    renderUpdate: function(update) {
        var element = this._element;
        var containerElement = element.parentNode;
        EchoRender.renderComponentDispose(update, update.parent);
        containerElement.removeChild(element);
        this.renderAdd(update, containerElement);
        return false;
    }
});
    
    