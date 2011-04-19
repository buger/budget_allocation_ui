(function(window, $, undefined ){
    var UIWeightElement = function(dom_id, type){    
        this.type = type || "totals"
        this.dom_container = $('#'+dom_id);
        this.bars = [];    
        this.max_value = 100;
        this.total_sum = 0;

        var self = this;
            
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
        
        this.container.bind('ui_weight:updateBars', function(evt, data){
            self.updateBars(data);
        });

        return this;
    }


    UIWeightElement.currently_resizing_bar = null;

    UIWeightElement.prototype.addBar = function(name, value, options) {
        var self = this;

        var bar = 
          $("<li>"+
            "<a class='delete'></a>"+
            "<span class='label' title='Click to edit'>"+name+"</span>"+
            "<input type='hidden' name='"+name.toLowerCase()+"'/>"+
            "<span class='bar' data-value='"+value+"'></span>"+
          "</li>")
          .bind('selectstart', function(){
              event.preventDefault();
           })
           .appendTo(this.bars_container);

        bar.find('.bar').bind('mousedown', function(){
          var bar = $(this);
          bar.data('last_width', bar.width());
          UIWeightElement.currently_resizing_bar = this; 
        });

        bar.find('.delete').bind('click', function(){        
            self.deleteBar(bar);
        });

        this.total_sum += value;
        this.updateBars();
        
        return this;
    }

    UIWeightElement.prototype.deleteBar = function(bar) {
        this.total_sum -= bar.find('.bar').data('value');
        bar.remove();
        this.updateBars();
    }

    UIWeightElement.prototype.updateBars = function(animate){
        if (animate === undefined) {
            animate = true;
        }

        var i, width, last_width, total, self = this;
        var bars = this.bars_container.find('li .bar');
        var labels = this.bars_container.find('li .label');

        var max_label_width = Math.max.apply(Math, $.map(labels, function(l) { return l.offsetWidth }));
        max_label_width += 30;

        var container_width = this.container.width() - max_label_width;

        var values = $.map(bars, function(b){ 
            var value = $(b).data('value');

            if (last_width = $(b).data('last_width')) {
                if (self.type === "relative4") {
                    value = ($(b).width()/container_width)*self.total_sum;
                    $(b).data('value', value).data('last_width', $(b).width());
                } else {
                    value = ($(b).width()/last_width)*value;  
                    $(b).data('value', value).data('last_width', $(b).width());
                }
            }
                    
            return value;
        });    

        var max_value = Math.max.apply(Math, values);

        for(i=0, total=0; i<values.length; total+=values[i++]);

        var bar = UIWeightElement.currently_resizing_bar;

        if (self.type === "relative4" && total != self.total_sum) {
            var diff = total-self.total_sum;

            if (bar)
                var total_without_current = total - $(bar).data('value');
            else 
                var total_without_current = total;

            if (total_without_current < 1)
                total_without_current = 1;            


            for (i=0; i<bars.length; i++) {
                if (bars[i] != bar) {
                    var value = $(bars[i]).data('value') - ($(bars[i]).data('value')/total_without_current)*diff;

                    $(bars[i]).data('value', value);
                }
            }
        }
        
        bars.each(function() {
            var value = $(this).data('value');

            if (self.type === "relative2" || self.type === "relative4")
                $(this).data('max_width', container_width);

            if (self.type === "relative") {
                width = value/max_value*container_width;
            } else if (self.type === "relative2") {
                width = value/100*container_width;
            } else if (self.type === "relative4") {
                width = value/self.total_sum*container_width;
            } else if (self.type === "relative3") {
                width = value/total*container_width;
            } else {
                width = value/100*container_width;
            }
            
            if (width < 1)
                width = 1;

            if (animate) {
                $(this).animate({ width: width })
                    .css({ left: max_label_width });
            } else if (self.type === "relative4" && this != UIWeightElement.currently_resizing_bar) {
                $(this).css({ width: width, left: max_label_width });
            }

            if (self.type === "relative" || self.type === "relative2" || self.type === "relative3" || self.type === "relative4") {
                if (self.type === "relative4") {
                    total = self.total_sum;
                }

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

    window.UIWeightElement = UIWeightElement;
})(window, jQuery)
