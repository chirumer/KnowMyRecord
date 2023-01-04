$('#whole_file_upload_btn').click(async () => {

  $('#whole_file_upload_btn').prop('disabled', true);

  const form_data = new FormData();
  if ($('#file_input')[0].files.length == 0) {
    alert('no file selected');
    $('#whole_file_upload_btn').prop('disabled', false);
    return;
  }
  const description = $('#description').val();
  if (description.length == 0) {
    alert('no description specified');
    $('#whole_file_upload_btn').prop('disabled', false);
    return;
  }
  const file = $('#file_input')[0].files[0]
  form_data.append('file', file);
  form_data.append('file_name', file.name);
  form_data.append('description', description);

  const response = await fetch('/upload_patient_record', {
    method: 'POST',
    body: form_data,
  });

  if (!response.ok) {
    alert('error uploading file');
    $('#whole_file_upload_btn').prop('disabled', false);
    return;
  }

  const { blob_uuid } = await response.json();
  $(location).prop('href', '/new_patient_record_details?' + new URLSearchParams({ blob_uuid }));
});