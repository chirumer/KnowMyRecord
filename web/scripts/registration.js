$('#register_btn').click(async () => {
  $('#authorize_btn').prop('disabled', true);

  const user_type = $('.active').attr('id');
  const user_details = { user_type };

  if (user_type == 'patient') {
    user_details.aadhaar = $('#aadhaar').val();
    user_details.name = $('#name').val();
  }
  else if (user_type == 'hospital') {
    user_details.hin = $('#hin').val();
    user_details.name = $('#name').val();
    user_details.location = $('#location').val();
  }

  const response = await fetch('/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user_details),
  })

  if (response.ok) {
    $(location).prop('href', '/');
  }
  else {
    $('#authorize_btn').prop('disabled', false);
    alert('Could Not Connect');
  }
});