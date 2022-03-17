$(function () {
  $.extend(jQuery.validator.messages, {
    required: "*",
  });

  $.each($(".form #inputgroup_"), function (index) {
    let new_index = index + 1;

    $(this).attr("id", "inputgroup_" + new_index);
    $(this)
      .parent()
      .find(".add-input-row")
      .attr("value", `inputgroup_${new_index}`);

    replace_identifiers($(this), new_index);
  });

  $(".add-input-row").click(function () {
    let current_id = $(this).attr("value");
    let next_index = parseInt(current_id.match(/\d+/)[0], 10) + 1;
    let additional_container = $(`#${current_id}`)
      .parent()
      .find("#additionalInput");

    let last_item = additional_container.find(".input-group").last();
    if (last_item.length != 0) {
      next_index = parseInt(last_item.attr("id").match(/\d+/)[0], 10) + 1;
    }

    let new_html_object = $("#" + current_id).clone();
    replace_identifiers(new_html_object, next_index);

    let html =
      `<div id="inputgroup_${next_index}" style="display: none" class="input-group">`;
    html +=
      '<div class="closer"><svg class="bi" width="50%" height="50%"><use xlink:href="#close"></use></svg></div>';
    html += new_html_object.html();
    html += "</div>";

    additional_container.append(html);
    additional_container
      .find("h4")
      .html("Additional " + $(`#${current_id} h4`).html());

    $(`#inputgroup_${next_index}`).slideDown();
    loadPersist();

    $(document).on("click", ".closer", function () {
      $(this)
        .parent()
        .slideUp("normal", function () {
          $(this).remove();
        });
    });
  });

  $(".form").validate({ rules: getValidationRules() });

  $(".form").submit(function (event) {
    let status = $(this).validate({ rules: getValidationRules() });
    if (!Object.keys(status.invalid).length) {
      submitForm(this);
      getHistory();
    }
    event.preventDefault();
  });

  loadPersist();
  getHistory();
});


function getHistory() {
  $.each($(".form"), function () {
    let id = $(this).attr("id")
    getExecutionHistory(
      (id = id),
      (url = `${learners_url}/form/`),
      (token = getCookie("auth"))
    ).then(function (response) {
      if (response.completed) {
        disableForm(id);
      }
    });
  });
}

function disableForm(id) {
  $(`#${id} .btn-submit-form`).prop("disabled", true);

  let input_types = ["input", "textarea", "select", "button"];
  $.each(input_types, function () {
    $.each($(`#${id}`).find(String(this)), function () {
      $(this).prop("disabled", "true");
    });
  });
}

function replace_identifiers(obj, next_index) {
  let input_types = ["input", "textarea", "select"];
  var regex = /[^a-zA-Z]/g;

  $.each(input_types, function () {
    $.each(obj.find(String(this)), function () {
      let base = $(this).attr("id").replace(regex, "");
      $(this).attr("id", `${base}_${next_index}`);
      base = $(this).attr("name").replace(regex, "");
      $(this).attr("name", `${base}_${next_index}`);
    });
  });

  $.each(obj.find("label"), function () {
    let base = $(this).attr("for").replace(regex, "");
    $(this).attr("for", `${base}_${next_index}`);
  });
}

function getValidationRules() {
  var rule_dict = {};
  $.each($(".form .required"), function () {
    key = $(this).attr("id");
    rule_dict[key] = "required";
  });
  return rule_dict;
}

function submitForm(form) {
  var formData = getFormData($(form));
  var method = $(".form").hasClass("mail") ? "mail" : "";

  executeAndCheck(
    (id = $(form).attr("id")),
    (type = "form"),
    (token = getCookie("auth")),
    (url_execute = `${learners_url}/form/`),
    (url_check = `${learners_url}/form/`),
    (payload_data = formData),
    (additional_headers = { Method: method }),
    (disable_on_success = true)
  );
}

function getFormData($form) {
  var unindexed_array = $form.serializeArray();
  var indexed_array = {};

  $.map(unindexed_array, function (n, i) {
    indexed_array[n["name"]] = n["value"];
  });

  return indexed_array;
}

function loadPersist() {
  $.each($(".form input"), function () {
    $(this).attr("value", localStorage.getItem($(this).attr("name")));
    $(this).on("change", (e) => {
      localStorage.setItem(e.target.name, e.target.value);
    });
  });

  $.each($(".form textarea, .form select"), function () {
    $(this).val(localStorage.getItem($(this).attr("name")));
    $(this).on("change", (e) => {
      localStorage.setItem(e.target.name, e.target.value);
    });
  });
}
