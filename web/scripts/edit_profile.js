$('#change_btn').click(async () => {
  $('#change_btn').prop('disabled', true);

  const user_details = {  };

  $('.user_data:visible').each(function() {
    const ele = $(this);
    user_details[ele.attr('id')] = ele.val();
  })

  console.log(user_details);
  
  // const response = await fetch('/edit_profile', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(user_details),
  // })

  if (response.ok) {
    $(location).prop('href', '/');
  }
  else {
    $('#change_btn').prop('disabled', false);
    alert('Could Not Connect');
  }
});