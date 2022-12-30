const url_params = new URLSearchParams(location.search);
const blob_uuid = url_params.get('blob_uuid');

$('#submit_btn').click(async () => {
  const patient_aadhaar = $('#patient_aadhaar').val();

  let wallet_address =
  await (async () => {
    const response = await fetch('/get_patient?' + new URLSearchParams({ patient_aadhaar }));
  
    if (!response.ok) {
      const { error_reason } = await response.json();
      alert(error_reason);
      return null;
    }

    return (await response.json()).wallet_address;
  })();
  if (wallet_address == null) {
    return;
  }

  let checksum =
  await (async () => {
    const response = await fetch('/get_checksum?' + new URLSearchParams({ blob_uuid }));
  
    if (!response.ok) {
      const { error_reason } = await response.json();
      alert(error_reason);
      return null;
    }

    return (await response.json()).checksum;
  })()
  if (checksum == null) {
    return;
  }

  // ethers request
  

  $(location).prop('href', '/activity');  
});