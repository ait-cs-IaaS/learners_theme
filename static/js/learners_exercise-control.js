const indicator_id_executed = "#exercise_executed";
const indicator_id_completed = "#exercise_completed";


/*
The following short functions 'showLoading', 'showSuccess', 'showError' serve 
to give the user a visual feedback on the exercise progress. Basically they 
toggle the corresponding classes.

params:
    id: the respective id of the element to change
    delay: option to delay the effect
*/

function showLoading(id) {
    // switch indicator to loading
    $(id)
        .stop(true, true)
        .removeClass("failed")
        .removeClass("success")
        .addClass("loading")
        .show();
}

function showSuccess(id, delay = 200) {
    // switch indicator to check
    $(id)
        .stop(true, true)
        .delay(delay)
        .queue(function (next) {
            $(this)
                .removeClass("loading")
                .removeClass("failed")
                .addClass("success")
                .show();
            next();
        });
}

function showError(id, delay = 200) {
    // switch indicator to fail
    $(id)
        .stop(true, true)
        .delay(delay)
        .queue(function (next) {
            $(this)
                .removeClass("loading")
                .removeClass("success")
                .addClass("failed")
                .show();
            next();
        });
}


/*
This function queries 'Learners' for the current status of the corresponding 
exercise. The exercise must be passed as URL (in default case as URL of 
learners + "/check_completion/" + uuid of the execute-request).

params:
    url: Learners Endpoint 
    token: JWT Token
    history: Whether or not to display the execution history (default = true)
*/

function getCurrentState(url, token, history = true) {
    var defer = $.Deferred();
    $.ajax({
        type: "GET",
        url: url, // use uuid-dependand URL
        crossDomain: true,
        headers: { Authorization: "Bearer " + token }, // append JWT token

        // execute if the request was successful
        success: function (data) {
            // display execution state
            if (data.script_executed) {
                showSuccess(indicator_id_executed);
            } else {
                showError(indicator_id_executed);
            }

            // display completion state
            if (data.completed) {
                showSuccess(indicator_id_completed);
            } else {
                showError(indicator_id_completed);
            }
            if (history) {
                // print last 10 tries
                printHistory(data.history);
            }
            defer.resolve(data);
        },

        // execute if request failed
        error: function (jqXHR, textStatus, errorThrown) {
            // display errors
            showError(indicator_id_executed);
            showError(indicator_id_completed);
            defer.reject(jqXHR, textStatus, errorThrown);
        },
    });
    return defer.promise();
}


/*
This function is responsible for constructing the execution history in the DOM.

params:
    history: A json-object comprising: 'start_time', 'response_time', 'completed'
*/

function printHistory(history) {
    if (history) {
        // starting block of html (table header)
        var tbl_body = `
            <table id='history-table'>
                <tr> 
                    <th>Exercise started</th> 
                    <th>Response received</th> 
                    <th>Completed</th> 
                </tr>
            `;

        // construct each row
        $.each(history, function () {
            var tbl_row = "";

            // construct each column per row
            $.each(this, function (key, value) {
                if (key == "completed") {
                    if (Boolean(value)) {
                        value = `
                            <span class='success'>
                                succeded
                            </span>
                            `;
                    } else {
                        value = `
                            <span class='failed'>
                                failed
                            </span>
                            `;
                    }
                }
                if (value == null) {
                    value = "no response";
                }
                tbl_row = "<td>" + value + "</td>" + tbl_row;
            });

            // append row to body
            tbl_body += "<tr>" + tbl_row + "</tr>";
        });

        tbl_body += "</table>";

        // create DOM
        $("#history").html(tbl_body);
        $("#history").slideDown();
    }
}


/*
This function serves as a generic ajax-request function that returns a promise.

params:
    type: "GET", "POST"
    payload: A dict comprising the URL and optional 'additional_headers' and 'data'
*/

// ajax request function
function sendAjax(type, payload, token) {
    let promise = new Promise((resolve, reject) => {
        $.ajax({
            type: type,
            url: payload.url,
            crossDomain: true,
            headers: Object.assign(
                {},
                { Authorization: "Bearer " + token },
                payload.additional_headers
            ),
            data: payload.data,

            // execute if the request was successful
            success: function (data) {
                resolve(data);
            },

            // execute if request failed
            error: function (jqXHR, textStatus, errorThrown) {
                reject(jqXHR, textStatus, errorThrown);
            },
        });
    });

    return promise;
}

// execute when button is clicked
function executeAndCheck(
    type,
    btn,
    token,
    url_execute,
    url_check,
    payload_data,
    additional_headers,
    disable_on_success = false
) {
    // prevent multiple executions
    $(btn).prop("disabled", true);

    let execution = false;
    let url_check_uuid = "";

    showLoading(indicator_id_executed);
    showLoading(indicator_id_completed);

    $("#error-msg").html("");
    $("#success-msg").html("");

    $.when(
        sendAjax(
            "POST",
            (payload = {
                url: url_execute,
                data: payload_data,
                additional_headers: additional_headers,
            }),
            token
        )
    )

        // execute if the execution-request was successful
        .then(function (data, textStatus, jqXHR) {
            if (data.executed == true) {
                showSuccess(indicator_id_executed);
                execution = true;
            } else {
                showError(indicator_id_executed);
                showError(indicator_id_completed);
                $("#error-msg").html("Execution failed.<br>");
            }

            if (type == "script") {
                // concatenate CPM-check base URL with UUID
                url_check_uuid = url_check + data.uuid;
            }
        })

        // execute if execution-request failed
        .catch(function (resp) {
            showError(indicator_id_executed);
            showError(indicator_id_completed);
            $("#error-msg").html("Connection failed.<br>");
        })

        .then(function () {
            // only check on completion if the execution was successful
            if (execution && type == "script") {
                $.when(
                    sendAjax(
                        "GET",
                        (payload = {
                            url: url_check_uuid,
                        }),
                        token
                    )
                )

                    // execute if the response was received
                    .then(function (data, textStatus, jqXHR) {
                        if (data.completed == true) {
                            showSuccess(indicator_id_completed);
                            $("#success-msg").html("Execution completed.<br>");
                        } else {
                            showError(indicator_id_completed);
                            $("#error-msg").append("Not completed.<br>");
                        }

                        // update history
                        getCurrentState((url = url_getCurrentState), (token = token));

                        // enable button for further executions
                        $(btn).prop("disabled", false);
                    })

                    // execute if completion-request failed
                    .catch(function (resp) {
                        showError(indicator_id_completed);
                        $("#error-msg").append("Connection failed.<br>");

                        // enable button for further executions
                        $(btn).prop("disabled", false);
                    });
            } else if (execution) {
                showSuccess(indicator_id_completed, (delay = 800));
                $("#success-msg").html("Exercise completed.<br>");

                // enable button for further executions
                if (!disable_on_success) {
                    $(btn).prop("disabled", false);
                }
            } else {
                // enable button for further executions
                $(btn).prop("disabled", false);
            }
        });
}
