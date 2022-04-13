
const short_msgs = {
  executed: "Successfully executed",
  execution_failed: "Connection failed",
  completed: "Exercise completed",
  partial: "Partially completed",
  completion_failed: "Exercise not completed",
  never_executed: "Exercise not executed yet",
  server_error: "Server error",
  data_fail: "Error in data format",
  history_completed: "succeeded",
  history_partial: "partially succeeded",
  history_fail: "failed",
}

function showLoading(id) {
  $(id)
    .stop(true, true)
    .removeClass("failed")
    .removeClass("success")
    .removeClass("none")
    .removeClass("partial")
    .addClass("loading")
    .show();
}

function showSuccess(id, delay = 200) {
  $(id)
    .stop(true, true)
    .delay(delay)
    .queue(function (next) {
      $(this)
        .removeClass("loading")
        .removeClass("failed")
        .removeClass("none")
        .removeClass("partial")
        .addClass("success")
        .show();
      next();
    });
}

function showPartialSuccess(id, delay = 200) {
  $(id)
    .stop(true, true)
    .delay(delay)
    .queue(function (next) {
      $(this)
        .removeClass("loading")
        .removeClass("failed")
        .removeClass("none")
        .removeClass("success")
        .addClass("partial")
        .show();
      next();
    });
}

function showError(id, delay = 200) {
  $(id)
    .stop(true, true)
    .delay(delay)
    .queue(function (next) {
      $(this)
        .removeClass("loading")
        .removeClass("success")
        .removeClass("none")
        .removeClass("partial")
        .addClass("failed")
        .show();
      next();
    });
}

function showNone(id, delay = 200) {
  $(id)
    .stop(true, true)
    .delay(delay)
    .queue(function (next) {
      $(this)
        .removeClass("loading")
        .removeClass("success")
        .removeClass("failed")
        .removeClass("partial")
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
  showNone(`#${parentID} #exercise_executed`);
  showNone(`#${parentID} #exercise_completed`);
  var msg_container = $(`#${parentID} #msg-container #msg`);
  msg_container.removeClass("success error partial")
  msg_container.html(short_msgs.never_executed);
}

function showMsg(parentID, data) {
  var msg_detail = $(`#${parentID} #msg-detail`);
  msg_detail.removeClass("sucess error partial")
  if (data.partial)
    msg_detail.addClass("partial")
  else if (!data.completed || data.never_executed || !data.executed)
    msg_detail.addClass("error")
  else
    msg_detail.addClass("sucess")

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
  var msg_container = $(`#${parentID} #msg-container #msg`);
  var submit_btn = $(`#${parentID} #submitExercise`);

  msg_container.removeClass("success error partial")

  if (data.executed != undefined) {
    if (data.executed || data.partial) {
      showSuccess(id_executed);
      msg_container.addClass("success")
      msg_container.html(short_msgs.executed);
      return true;
    } else {
      showError(id_executed);
      showError(id_completed);
      msg_container.addClass("error")
      msg_container.html(short_msgs.execution_failed);
      submit_btn.prop("disabled", false);
      return false;
    }
  } else {
    msg_container.addClass("error")
    msg_container.html(short_msgs.server_error);
    return false;
  }
}

function showCompletionState(parentID, data, disable_on_success) {
  var id_completed = `#${parentID} #exercise_completed`;
  var msg_container = $(`#${parentID} #msg-container #msg`);
  var submit_btn = $(`#${parentID} #submitExercise`);

  msg_container.removeClass("success error partial")

  if (data.completed != undefined) {
    if (data.partial) {
      showPartialSuccess(id_completed);
      msg_container.addClass("partial")
      msg_container.html(short_msgs.partial);
      submit_btn.prop("disabled", false);
      return false;
    } else if (data.completed) {
      showSuccess(id_completed);
      msg_container.addClass("success")
      msg_container.html(short_msgs.completed);
      if (!disable_on_success) submit_btn.prop("disabled", false);
      return true;
    } else {
      showError(id_completed);
      msg_container.addClass("error")
      msg_container.html(short_msgs.completion_failed);
      submit_btn.prop("disabled", false);
      return false;
    }
  } else {
    showError(id_completed);
    msg_container.addClass("error")
    msg_container.html(short_msgs.data_fail);
    submit_btn.prop("disabled", false);
  }
}

function sendAjax(type, payload) {
  let promise = new Promise((resolve, reject) => {

    $.ajax({
      type: type,
      url: payload.url,
      headers: Object.assign(
        { "Content-type": "application/json" },
        { Authorization: `Bearer ${getCookie("access_token_cookie")}` },
        payload.additional_headers
      ),
      data: payload.data,

      success: function (data) {
        resolve(data);
      },

      error: function (jqXHR, textStatus, errorThrown) {
        reject(jqXHR, textStatus, errorThrown);
      },
    });
  });

  return promise;
}

function printHistory(parentID, history) {
  var history_container = $(`#${parentID} #history`);

  if (history) {
    var tbl_body = `
            <table id='history-table'>
                <tr> 
                    <th>Exercise started</th> 
                    <th>Response received</th> 
                    <th>Completed</th> 
                </tr>
            `;

    $.each(history, function () {
      let start_time = this.start_time;
      let response_time = (() => (this.response_time) ? this.response_time : "no response")();
      let completed = (() => {
        if (this.partial)
          return `<span class='partial'>${short_msgs.history_partial}</span>`
        if (this.completed)
          return `<span class='success'>${short_msgs.history_completed}</span>`
        else
          return `<span class='failed'>${short_msgs.history_fail}</span>`;
      })();

      tbl_body += `<tr> <td> ${start_time} </td> <td> ${response_time} </td> <td> ${completed} </td> </tr>`;
    });

    tbl_body += "</table>";

    history_container.html(tbl_body);

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
  var disable_on_success = false;

  showLoading(`#${exercise.id} #exercise_executed`);
  showLoading(`#${exercise.id} #exercise_completed`);
  $(`#${exercise.id} #submitExercise`).prop("disabled", true);
  $(`#${exercise.id} #error-msg`).html("");
  $(`#${exercise.id} #success-msg`).html("");
  $(`#${exercise.id} #notification-msg`).html("");

  let data = {
    "name": exercise.id,
  }

  if (exercise.type == "script") {
    data["script"] = exercise.script
  } else {
    data["form"] = exercise.formData
  }

  data = JSON.stringify(data)

  sendAjax("POST", { url: `/execution/${exercise.type}`, data: data })
    .then(function (data, textStatus, jqXHR) {
      showExecutionState(exercise.id, data);
      sendAjax("GET", { url: `/execution/${exercise.id}` })
        .then(function (data, textStatus, jqXHR) {
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

function getExecutionHistory(exercise) {
  var defer = $.Deferred();

  var id_executed = `#${exercise.id} #exercise_executed`;
  var id_completed = `#${exercise.id} #exercise_completed`;

  showLoading(id_executed);
  showLoading(id_completed);

  sendAjax("GET", { url: `/execution/${exercise.id}` })
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
  sendAjax("GET", { url: `/execution-state` })
    .then(function (data, textStatus, jqXHR) {

      $.each(data.success_list, function (parentTitle, parentExercise) {

        let menuItem = $(`.topics li[title='${parentTitle}']`).find("a").first()
        update_counter(menuItem, parentExercise.done, parentExercise.total)

        $.each(parentExercise.exercises, function (i, subExercise) {
          let subMenuItem = $(`.topics li[title='${subExercise.title}']`).find("a").first()
          if (subMenuItem.length > 0) {
            update_counter(subMenuItem, subExercise.done, subExercise.total)
          }
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