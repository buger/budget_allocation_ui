var skills = [];
for (var i=0; i<window.skills_dictionary.length; i++) {
    if (skills.indexOf(window.skills_dictionary[i][1]) == -1)
        skills.push(window.skills_dictionary[i][1]);
}

$(function(){    
    $(document).bind('mousemove', function(evt){
        var bar = BudgetAllocationUI.currently_resizing_bar;
        if (bar) {
            var x = evt.clientX;
            window.old_mouse_x = window.old_mouse_x || x;

            var offset = (x-old_mouse_x);
            var width = $(bar).width()+offset;
            var max_width = $(bar).data('max_width');

            if (max_width && width > max_width) {                
                width = max_width;
            }            
            
            if (width < 1)
                width = 1

            $(bar).css({
                width: width+'px'
            });

            window.old_mouse_x = x;

            $(bar).closest(".ui-weight-container").trigger('ui_weight:updateBars', false);
        }
    });
    $(document).bind('mouseup', function() {
        var bar = BudgetAllocationUI.currently_resizing_bar;
        if (bar)
            $(bar).data('last_width','');            
            
            $(bar).closest(".ui-weight-container").trigger('ui_weight:updateBars', true);

        BudgetAllocationUI.currently_resizing_bar = null;
        window.old_mouse_x = null;
    });

    var current_editable_input;
    
    BudgetAllocationUI.editLabel = function(label){
        if (!$(label).hasClass('edit')) {
            if (current_editable_input && current_editable_input.parentNode != label) {
                var value = current_editable_input.value;

                $(current_editable_input).parent().removeClass('edit').html(value)
                    .closest(".ui-weight-container").trigger('ui_weight:updateBars', true);
            }

            var text = $(label).text();
            var input = $("<input value='"+text+"' type='text'/>");
            input.css({width: ($(label).width()+10)+'px'});

            var labels = $(label).closest('.ui-weight-container').find('.label');
            var max_label_width = Math.max.apply(Math, $.map(labels, function(l) { return l.offsetWidth }));

            $(label).html(input);

            $(label).find('input')[0].setSelectionRange(text.length, text.length);            
            
            $(label).find('input').autocomplete({ source: skills })
                .css({ width: max_label_width });

            $(label).addClass('edit');
                
            current_editable_input = $(label).find('input')[0];
        }
    }

    $('.ui-weight-container .label').live('click', function(){
        BudgetAllocationUI.editLabel(this);
    });
    
    $(document).bind('click', function(evt) {
        if (current_editable_input && evt.target != current_editable_input && current_editable_input.parentNode != evt.target) {
            var value = current_editable_input.value;
            $(current_editable_input).parent().removeClass('edit').html(value)
                .closest(".ui-weight-container").trigger('ui_weight:updateBars', true);
        }

        return true;
    });
});


$('input, textarea').placeholder();

$('.buttons input[type=submit]').live('click', function(){    
    var button = $(this);

    button.attr('disabled', true);
    button.val("Saving...");

    setTimeout(save_form, 1000);
    setTimeout(function(){
        $('#notice').html("Your skills were saved").show().delay(1000).fadeOut(400);
    }, 1000)
});

function save_form() {
    var comment = $('textarea').val();
    var button = $('input[type=submit]');

    if (!store.get("user_id")) {
        window.user_id = +new Date();
        store.set("user_id", user_id);
    }

    var last_save = +new Date();
    store.set("last_save", last_save);

    var data = {
        user_id: window.user_id,
        comment: comment,        
        skills: widget.getJSON()
    }

    $.ajax({
        dataType: "jsonp",
        type: "POST",
        url: "http://foobar-utils.appspot.com/json/set/" + last_save,        
        data: {
            namespace: "budget_allocation_ui",
            json: JSON.stringify(data)
        },
        complete: function(){
            button.removeAttr('disabled');
            button.val("Save");
            $('textarea').val('');
        }
    });
}
