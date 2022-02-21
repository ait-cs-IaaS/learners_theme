$(function () {

    // window.localStorage.setItem(
    //     "formbuffer", 
    //     $("form").html()
    //     );

    // $("#additionalInput").html(window.localStorage.getItem("formbuffer"));

    // maybe persist form data in local storage?
    // https://www.section.io/engineering-education/how-to-use-localstorage-with-javascript/

    $.extend(jQuery.validator.messages, {
        required: "*"
    });

    
    $.each( $(".form #inputgroup_"), function( index){
        let new_index = index + 1;

        $(this).attr("id", "inputgroup_" + new_index);
        $(this).parent().find(".add-input-row").attr("value", "inputgroup_" + new_index);
        
        replace_identifiers($(this), new_index);

    });

    $(".add-input-row").click(function() {

        let current_id = $(this).attr("value");
        let next_index = parseInt(current_id.match(/\d+/)[0], 10) * 100;
        let additional_container = $("#" + current_id).parent().find("#additionalInput")

        let last_item = additional_container.find(".input-group").last()
        if (last_item.length != 0) {
            next_index = parseInt((last_item.attr("id")).match(/\d+/)[0], 10) + 1;
        }
        
        let new_html_object = $("#" + current_id).clone();
        replace_identifiers(new_html_object, next_index);

        let html = '<div id="inputgroup_' + next_index + '" style="display: none" class="input-group">';
        html += '<div class="closer"><svg class="bi" width="50%" height="50%"><use xlink:href="#close"></use></svg></div>';
        html += new_html_object.html()
        html += '</div>';

        additional_container.append(html);
        additional_container.find("h4").html(
            "Additional " + 
            $("#" + current_id + " h4").html()
        );

        $("#inputgroup_" + next_index).slideDown();

        $(document).on("click", ".closer" , function() {
            $(this).parent().slideUp("normal", function() { 
                $(this).remove(); 
            });
        });

    })

    $( ".form" ).validate({
        rules: getValidationRules(),
        submitHandler: function(form) {
            console.log($(form));
        }        
    })
    

    // $( ".form" ).submit(function(event) {
    //     event.preventDefault();
    //     rule_dict = getValidationRules()[0];
    //     msg_dict = getValidationRules()[1];
        
    //     // $.post(
    //     //     'insert_endpoint_here.html',
    //     //      $(this).serialize(),
    //     //      function(data){
    //     //        $("#results").html(data)
    //     //      }
    //     //    );
    //     //    return false;   
    //   });

});

function replace_identifiers(obj, next_index) {
    let input_types = ["input", "textarea", "select"]

    $.each(input_types, function(){
        $.each( obj.find(String(this)), function(){
            console.log(this)
            $(this).attr("id", $(this).attr("id") + "_" + next_index);
            $(this).attr("name", $(this).attr("name") + "_" + next_index);
        });
    });

    $.each( obj.find("label"), function(){
        $(this).attr("for", $(this).attr("for") + "_" + next_index);
    });
}

function getValidationRules() {
    var rule_dict = {}
    $.each( $(".form .required"), function(){
        key = $(this).attr("id");
        rule_dict[key] = "required";
    });
    return rule_dict
}