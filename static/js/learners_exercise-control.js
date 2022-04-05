
  const short_msgs = {
    executed: "Successfully executed.",
    execution_failed: "Connection failed.",
    completed: "Exercise completed.",
    completion_failed: "Exercise not completed.",
    never_executed: "Exercise not executed yet.",
    server_error: "Server error.",
    data_fail: "Error in data format."
  }


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
    .removeClass("none")
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
        .removeClass("none")
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
        .removeClass("none")
        .addClass("failed")
        .show();
      next();
    });
}

function showNone(id, delay = 200) {
  // switch indicator to fail
  $(id)
    .stop(true, true)
    .delay(delay)
    .queue(function (next) {
      $(this)
        .removeClass("loading")
        .removeClass("success")
        .removeClass("failed")
        .addClass("none")
        .show();
      next();
    });
}

function visualFeedback(
  parentID = "",
  data = "",
  disable_on_success = false
) {
  if (data == "" || data == undefined) {
    showError(`#${parentID} #exercise_executed`);
    showError(`#${parentID} #exercise_completed`);
    $(parentID + " #error-msg").html(short_msgs.server_error);
    return false;
  } else if (!data.history) {
    showNoExecution(parentID);
    return false;
  } else {   
    showMsg(parentID, data);
    showExecutionState(parentID, data);
    showCompletionState(parentID, data, disable_on_success);
    return true;
  }
}

function showNoExecution(parentID) {
  var notification_container = $(`#${parentID} #notification-msg`);
  showNone(`#${parentID} #exercise_executed`);
  showNone(`#${parentID} #exercise_completed`);
  notification_container.html(short_msgs.never_executed);
}

function showMsg(parentID, data) {
  var msg_detail = $(`#${parentID} #msg-detail`);
  if (!data.completed || data.never_executed || !data.executed) {
    msg_detail.removeClass("sucess")
    msg_detail.delay(200).addClass("error")
  } else {
    msg_detail.removeClass("error")
    msg_detail.delay(200).addClass("sucess")
  }
  if (data.msg) {
    msg_detail.html(data.msg);
    msg_detail.slideDown();
  } else {
    msg_detail.html("");
  }
}

function showExecutionState(parentID, data) {
  var id_executed = `#${parentID} #exercise_executed`;
  var id_completed = `#${parentID} #exercise_completed`;
  var error_container = $(`#${parentID} #error-msg`);
  var success_container = $(`#${parentID} #success-msg`);
  var notification_container = $(`#${parentID} #notification-msg`);
  var submit_btn = $(`#${parentID} #submitExercise`);
  
  if (data.executed != undefined) {
    notification_container.html("");
    if (data.executed) {
      showSuccess(id_executed);
      error_container.html("");
      success_container.html(short_msgs.executed);
    } else {
      showError(id_executed);
      showError(id_completed);
      success_container.html("");
      error_container.html(short_msgs.execution_failed);
      submit_btn.prop("disabled", false);
      return false;
    }
  } else {
    error_container.html(short_msgs.server_error);
  }
}

function showCompletionState(parentID, data, disable_on_success) {
  var id_completed = `#${parentID} #exercise_completed`;
  var error_container = $(`#${parentID} #error-msg`);
  var success_container = $(`#${parentID} #success-msg`);
  var submit_btn = $(`#${parentID} #submitExercise`);
  var notification_container = $(`#${parentID} #notification-msg`);

  if (data.completed != undefined) {
    notification_container.html("");
    if (data.completed) {
      showSuccess(id_completed);
      error_container.html("");
      success_container.html(short_msgs.completed);
      if (!disable_on_success) submit_btn.prop("disabled", false);
      return true;
    } else {
      showError(id_completed);
      success_container.html("");
      error_container.html(short_msgs.completion_failed);
      submit_btn.prop("disabled", false);
      return false;
    }
  } else {
    showError(id_completed);
    error_container.html(short_msgs.data_fail);
    submit_btn.prop("disabled", false);
  }
}

/*
This function serves as a generic ajax-request function that returns a promise.

params:
    type: "GET", "POST"
    payload: A dict comprising the URL and optional 'additional_headers' and 'data'
*/

function sendAjax(type, payload, token) {
  let promise = new Promise((resolve, reject) => {

    $.ajax({
      type: type,
      url: payload.url,
      headers: Object.assign(
        { "Content-type": "application/json" },
        { Authorization: `Bearer ${token}` },
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

/*
This function is responsible for constructing the execution history in the DOM.

params:
    history: A json-object comprising: 'start_time', 'response_time', 'completed'
*/

function printHistory(parentID, history) {
  var history_container = $(`#${parentID} #history`);

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
        if (key != "msg") {
          if (key == "completed") {
            if (Boolean(value)) {
              value = `<span class='success'>succeded</span>`;
            } else {
              value = `<span class='failed'>failed</span>`;
            }
          }
          if (value == null && key == "msg") {
            value = "-";
          } else if (value == null) {
            value = "no response";
          }
          tbl_row = `<td> ${value} </td> ${tbl_row}`;
        }
      });

      // append row to body
      tbl_body += `<tr> ${tbl_row} </tr>`;
    });

    tbl_body += "</table>";

    // create DOM
    history_container.html(tbl_body);

    // Slide down effect
    if (history_container.find("tr").length > 2) {
      history_container.find("tr")
        .eq(1)
        .find("td")
        .wrapInner('<div style="display: none;" />')
        .parent()
        .find("td > div")
        .slideDown(700, function () {
          var $set = $(this);
          $set.replaceWith($set.contents());
        });
      history_container.slideDown();
    } else {
      history_container.slideDown();
    }
  }
}


function executeAndCheck(exercise) {
  var defer = $.Deferred();

  var id_executed = `#${exercise.id} #exercise_executed`;
  var id_completed = `#${exercise.id} #exercise_completed`;
  var submit_btn = $(`#${exercise.id} #submitExercise`);
  var disable_on_success = false;

  // prevent multiple executions
  submit_btn.prop("disabled", true);

  showLoading(id_executed);
  showLoading(id_completed);
  $(`#${exercise.id} #msg-detail`).slideUp(200);
  $(`#${exercise.id} #error-msg`).html("");
  $(`#${exercise.id} #success-msg`).html("");


  let data = {
    "name": exercise.id,
  }

  if (exercise.type == "script") {
    data["script"] = exercise.script
  } else {
    data["form"] = exercise.formData
  }

  data = JSON.stringify(data)

  sendAjax(
    (type = "POST"),
    (payload = { url: `/execution/${exercise.type}`, data: data }),
    (token = getCookie("access_token_cookie"))
  ).then(function (data, textStatus, jqXHR) {
    showExecutionState(exercise.id, data);
    sendAjax(
      (type = "GET"),
      (payload = { url: `/execution/${exercise.id}` }),
      (token = getCookie("access_token_cookie"))
    ).then(function (data, textStatus, jqXHR) {
      visualFeedback(exercise.id, data, disable_on_success);
      printHistory(exercise.id, data.history);
      getState();
      defer.resolve(data);
    })
      .catch(function (jqXHR, textStatus, errorThrown) {
        visualFeedback(exercise.id, jqXHR, disable_on_success);
        defer.reject(jqXHR, textStatus, errorThrown);
      });

    defer.resolve(data);
  })
    .catch(function (jqXHR, textStatus, errorThrown) {
      visualFeedback(exercise.id, jqXHR, disable_on_success);
      defer.reject(jqXHR, textStatus, errorThrown);
    });

  return defer.promise();
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

function getExecutionHistory(exercise) {
  var defer = $.Deferred();

  var id_executed = `#${exercise.id} #exercise_executed`;
  var id_completed = `#${exercise.id} #exercise_completed`;

  showLoading(id_executed);
  showLoading(id_completed);

  sendAjax("GET", (payload = { url: `/execution/${exercise.id}` }), (token = getCookie("access_token_cookie")))
    .then(function (data, textStatus, jqXHR) {
      visualFeedback(exercise.id, data);
      printHistory(exercise.id, data.history);
      defer.resolve(data);
    })
    .catch(function (jqXHR, textStatus, errorThrown) {
      visualFeedback(exercise.id, jqXHR);
      defer.reject(jqXHR, textStatus, errorThrown);
    });

  return defer.promise();
}

function getState() {
  var defer = $.Deferred();
  sendAjax("GET", (payload = { url: `/execution-state` }), (token = getCookie("access_token_cookie")))
    .then(function (data, textStatus, jqXHR) {

      $.each(data.success_list, function (parentTitle, parentExercise) {

        let menuItem = $(`.topics li[title='${parentTitle}']`).find("a").first()
        update_counter(menuItem, parentExercise.done, parentExercise.total)

        $.each(parentExercise.exercises, function (i, subExercise) {
          let subMenuItem = $(`.topics li[title='${subExercise.title}']`).find("a").first()
          update_counter(subMenuItem, subExercise.done, subExercise.total)
        })
      }
      );
      defer.resolve(data);
    })
    .catch(function (jqXHR, textStatus, errorThrown) {
      defer.reject(jqXHR, textStatus, errorThrown);
    });

  return defer.promise();
}

function update_counter(element, done, total) {
  let icon = element.find("i").first();
  icon.addClass("counter");
  if (element.html().match(/\(\d\/\d\)/)) {
    element.html(element.html().replace(/\(\d\/\d\)/, `(${done}/${total})`));
  } else if (icon.length) {
    icon.append(`(${done}/${total})`)
  } else {
    element.append(`<i class='fas read-icon counter'> (${done}/${total})</i>`)
  }

  if (done == total) {
    element.find("i").addClass("fa-check done")
  } else {
    element.find("i").removeClass("fa-check done")
  }
}