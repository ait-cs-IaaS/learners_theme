$(function () {
    let url_token = $(location).attr("search").split("?auth=")[1];

    // Set cookie if present in query-string
    if (url_token) {
        // function definition in "token-handling.js"
        setCookie("auth", url_token, 1);
    }

    // Get current token
    let token = getCookie("auth");

    // indicator_id_executed = "#exercise_executed"
    // indicator_id_completed = "#exercise_completed"

    let script_name = $(".btn-run-exercise").first().attr("value");

    if (script_name) {
        url_getCurrentState = learners_url + "/current_state/" + script_name;
        url_execute = learners_url + "/execute_script/" + script_name;
        // initial load
        getCurrentState((url = url_getCurrentState), (token = token));
    }

    let url_check = learners_url + "/check_completion/";

    // Run exercises
    $(".btn-run-exercise").click(function () {
        executeAndCheck(
            (type = "script"),
            (btn = this),
            (token = token),
            (url_execute = url_execute),
            (url_check = url_check)
        );
    });
});
