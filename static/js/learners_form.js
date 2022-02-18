$(function () {

    $("#add-input-row").click(function() {

        let current_id = $(this).attr('value');

        while ($("#inputgroup_" + current_id).length) {
            current_id ++;
        }

        var html = '';
        html += '<div id="inputgroup_' + current_id + '" class="input-group">';
        html += $("#inputgroup_" + (current_id - 1)).html()
        html += '</div>';

        $("#additionalInput").append(html);
        $("#additionalInput h4").html(
            "Additional " + 
            $("#inputgroup_" + $(this).attr('value') + " h4").html()
        );

        // let group_id = $(this).attr('value');
        // let current_group = $("#" + group_id)[0];

        // let new_group = current_group.append("<div>asdasdda</div>");
        // current_group.html(new_group);


        // let form = $(this).closest("form");
        // let current_content = form.html();

        // // form.append()
        
        // console.log(group_id);
        // console.log($("#" + group_id)[0]);
    })

});
