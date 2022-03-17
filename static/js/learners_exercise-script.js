$(function () {
  let script_name = $(".btn-run-exercise").first().attr("value");

  if (script_name) {
    let id = $(".exercise-control").first().attr("id");

    getExecutionHistory(
      (parentID = id),
      (url = `${learners_url}/history/${script_name}`),
      (token = getCookie("auth"))
    );

    // Run exercises
    $(".btn-run-exercise").click(function () {
      executeAndCheck(
        (id = id),
        (type = "script"),
        (token = getCookie("auth")),
        (url_execute = `${learners_url}/execute/${script_name}`),
        (url_check = `${learners_url}/monitor/`)
      );
    });
  }
});
