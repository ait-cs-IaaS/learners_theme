function formExercise(exercise) {

  $.extend(jQuery.validator.messages, {
    required: "*",
  });

  if ($(`#${exercise.id}`).find("#additionalInput").length) {
    initAdditionalInput(exercise);
  }

  $(`#${exercise.id}`).validate({ rules: getValidationRules() });

  $(`#${exercise.id}`).submit(function (event) {
    let status = $(this).validate({ rules: getValidationRules() });
    if (!Object.keys(status.invalid).length) {
      submitForm(this, exercise);
      getHistory(exercise);
    }
    event.preventDefault();
  });

  loadPersist(exercise);
  getHistory(exercise);
};

// ------------------------------------------------------------------------------------------------------------

function initAdditionalInput(exercise) {
  $.each($(`#${exercise.id} #inputgroup_`), function (index) {

    let new_index = index + 1;
    $(this).attr("id", `inputgroup_${new_index}`);
    $(this)
      .parent()
      .find(".add-input-row")
      .attr("value", `inputgroup_${new_index}`);

    replace_identifiers($(this), new_index);
  });

  $(".add-input-row").click(function () {
    let current_id = $(this).attr("value");
    let next_index = parseInt(current_id.match(/\d+/)[0], 10) + 1;
    let additional_container = $(this).parent().find(`#${current_id}`)
      .parent()
      .find("#additionalInput");
    
    let last_item = additional_container.find(".input-group").last();
    if (last_item.length != 0) {
      next_index = parseInt(last_item.attr("id").match(/\d+/)[0], 10) + 1;
    }
    
    let current_reference = $(this).parent().find(`#${current_id}`)
    let new_html_object = current_reference.clone();
    new_html_object.find("#fieldset-error").remove();
    replace_identifiers(new_html_object, next_index);

    let html =
      `<div id="inputgroup_${next_index}" style="display: none" class="input-group">`;
    html +=
      '<div class="closer"><svg class="bi" width="50%" height="50%"><use xlink:href="#close"></use></svg></div>';
    html += new_html_object.html();
    html += '</div>';

    additional_container.append(html);
    additional_container
      .find("h4")
      .html("Additional " + current_reference.find("h4").html());

    $(`#inputgroup_${next_index}`).slideDown();
    loadPersist(exercise);

    $(document).on("click", ".closer", function () {
      $(this)
        .parent()
        .slideUp("normal", function () {
          $(this).remove();
        });
    });
  });

}


function getHistory(exercise) {
  getExecutionHistory(exercise)
    .then(function (response) {
      if (response.completed) {
        disableForm(exercise.id);
      }
    });
}

function disableForm(id) {
  $(`#${id} .btn-submit-form`).prop("disabled", true);
  $(`#${id} .add-input-row`).remove();

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
    $.each(obj.find(String(this)).not("[name='minInputs']"), function () {
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


function getFormData($form) {
  var unindexed_array = $form.serializeArray();
  var indexed_array = {};
  
  $.map(unindexed_array, function (n, i) {
    indexed_array[n["name"]] = n["value"];
  });
  
  return indexed_array;
}

function loadPersist(exercise) {
  $.each($(`#${exercise.id} input`).not("[name='minInputs']"), function () {
    $(this).attr("value", localStorage.getItem($(this).attr("name")));
    $(this).on("change", (e) => {
      localStorage.setItem(e.target.name, e.target.value);
    });
  });

  $.each($(`#${exercise.id} textarea, #${exercise.id} select`), function () {
    $(this).val(localStorage.getItem($(this).attr("name")));
    $(this).on("change", (e) => {
      localStorage.setItem(e.target.name, e.target.value);
    });
  });
}

function minimumElements(form) {
  var valid = true;
  let fieldsets = $(form).find("fieldset");
  $.each(fieldsets, function () {
    let hidden_inputs = $(this).find("[name='minInputs']")
    if (hidden_inputs.length > 0 ) {
      var minInputs = hidden_inputs[0].value;
    }
    var additionalInputs = $(this).find("#additionalInput .input-group").length;
    if ( (additionalInputs + 1) < minInputs) {
      valid = false;
      $(this).addClass("error")
      $(this).find("#fieldset-error").html(
        `A minimum of ${minInputs} items are required. Only ${(additionalInputs + 1)} were given.`
      )
    } else {
      $(this).removeClass("error")
      $(this).find("#fieldset-error").html("")
    }
    let error = $("fieldset.error")
    if (error.length > 0) {
      $('html, body').animate({
        scrollTop: $("fieldset.error").offset().top
      }, 400);
    }
  });
  return valid
}

function submitForm(form, exercise) {
  if (minimumElements(form)) {
    exercise["formData"] = getFormData($(form));
    var method = $(`#${exercise.id}`).hasClass("mail") ? "mail" : "";
    executeAndCheck(exercise)
  }
}