function is_metamask_installed () {
  const { ethereum } = window;
  return Boolean(ethereum && ethereum.isMetaMask);
};

function metamask_authorize() {
  
}

$('#back_btn').click(() => {
  history.back();
});

if (is_metamask_installed()) {
  $('#metamask_btn').click(async () => {
    $('#metamask_btn').text('Connecting..');
    $('#metamask_btn').prop('disabled', true);
    try {
      await ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (!accounts[0]) {
        throw 'Could Not Access Account';
      }
    } catch (error) {
      alert(error.message);
    }

    metamask_authorize();
  });
}
else {
  $('#metamask_btn').text('Install MetaMask');
  $('#metamask_btn').click(() => {
    $('#metamask_btn').text('Installing..');
    $('#metamask_btn').prop('disabled', true);
    const onboarding = new MetaMaskOnboarding();
    onboarding.startOnboarding();
  });
}