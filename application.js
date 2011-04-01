var UIWeightElement = function(dom_id, type){    
    this.type = type || "totals"
    this.dom_container = $('#'+dom_id);
    this.bars = [];    
    this.max_value = 100;

    var self = this;
    $(document).bind('ui_weight:updateBars', function(evt, data){
        self.updateBars(data);
    });
    
    this.container = $("<div />", {
        className: "ui-weight-container"
    }); 
    
    if (this.type === "totals") {
        this.warning = $("<div class='warning'>Over Budget - Reduce Points</div>").appendTo(this.container).hide();        
        this.total_container = $("<div class='totals'>"+        
                                    "<span class='label'>Total</span>"+
                                    "<span class='bar'><span class='text'></span><span class='overflow'></span></span>"+
                                "</div>").appendTo(this.container);
    }

    this.bars_container = $("<ul />").appendTo(this.container);

    this.container.appendTo(this.dom_container);

    return this;
}

UIWeightElement.currently_resizing_bar = null;

UIWeightElement.prototype.addBar = function(name, value, options) {
    $("<li>"+
        "<span class='label'>"+name+"</span>"+
        "<input type='hidden' name='"+name.toLowerCase()+"'/>"+
        "<span class='bar' data-value='"+value+"'></span>"+
      "</li>")
      .bind('selectstart', function(){
          event.preventDefault();
       })
      .bind('mousedown', function(){
          var bar = $(this).find('.bar');
          bar.data('last_width', bar.width());
          UIWeightElement.currently_resizing_bar = $(this).find('.bar');
      })
      .appendTo(this.bars_container);

    this.updateBars();
    
    return this;
}

UIWeightElement.prototype.updateBars = function(animate){
    if (animate === undefined) {
        animate = true;
    }

    var i, width, last_width, total, self = this;
    var bars = this.bars_container.find('li .bar');
    var labels = this.bars_container.find('li .label');

    var max_label_width = Math.max.apply(Math, $.map(labels, function(l) { return l.offsetWidth }));

    var container_width = this.container.width() - max_label_width;

    var values = $.map(bars, function(b){ 
        var value = $(b).data('value');

        if (last_width = $(b).data('last_width')) {            
            value = ($(b).width()/last_width)*value;  
            
            $(b).data('value', value).data('last_width', $(b).width());
        }

        return value
    });
    var max_value = Math.max.apply(Math, values);

    for(i=0, total=0; i<values.length; total+=values[i++]);

    bars.each(function() {
        var value = $(this).data('value');
        $(this).data('max_width', container_width);

        if (self.type === "relative") {
            width = value/max_value*container_width;
        } else if (self.type === "relative2") {
            width = value/100*container_width;
        } else {
            width = value/100*container_width;
        }
        
        if (animate) {
            $(this).animate({ width: width })
                .css({ left: max_label_width });
        }

        if (self.type === "relative" || self.type === "relative2") {
            var percent = Math.round(value/total*100);
            $(this).html(percent+'%');
        } else {
            $(this).html(Math.round(value));
        }
    });

    if (self.type === "totals") {
        var totals = this.total_container.find('.bar');
        totals.css({
            width: total/100*container_width,
            left: max_label_width
        });
        
        var overflow_width = (total-100)/100 * container_width;
        if (overflow_width < 0)
            overflow_width = 0;

        totals.find('.overflow').css({
            width: overflow_width
        })

        totals.find('.text').html(Math.round(total));

        if (total > 100) {
            this.warning.show();
        } else {
            this.warning.hide();
        }
    }
}

$(function(){
    $(document).bind('mousemove', function(evt){
        var bar = UIWeightElement.currently_resizing_bar;
        if (bar) {
            var x = evt.clientX;
            window.old_mouse_x = window.old_mouse_x || x;

            var offset = (x-old_mouse_x);
            var width = $(bar).width()+offset;
            var max_width = $(bar).data('max_width');

            if (max_width && width > max_width) {                
                width = max_width;
            }            
            
            $(bar).css({
                width: width+'px'
            });

            window.old_mouse_x = x;

            $(document).trigger('ui_weight:updateBars', false);
        }
    });
    $(document).bind('mouseup', function() {
        if (UIWeightElement.currently_resizing_bar)
            $(UIWeightElement.currently_resizing_bar).data('last_width','');            
            $(document).trigger('ui_weight:updateBars', true);

        UIWeightElement.currently_resizing_bar = null;
        window.old_mouse_x = null;
    });
});
