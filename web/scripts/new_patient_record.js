import { ethers } from "/node_modules/ethers/ethers.esm.js";

let provider, signer;
try {
  provider = new ethers.providers.Web3Provider(window.ethereum);
  signer = provider.getSigner();
} catch(err) {
  alert('Not Connected To Wallet! Logging Out..');
  $(location).prop('href', '/logout'); 
}

const addition_contract_address = '0x656526f7818A359164a0E1FbDd5548E43E00408F';
const addition_contract_abi = (
`[
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "req_id",
				"type": "uint256"
			}
		],
		"name": "grantRequest",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_patient",
				"type": "address"
			},
			{
				"internalType": "bytes16",
				"name": "_blob_id",
				"type": "bytes16"
			},
			{
				"internalType": "bytes16",
				"name": "_blob_checksum",
				"type": "bytes16"
			}
		],
		"name": "Request",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "patient",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "hospital",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bytes16",
				"name": "blob_id",
				"type": "bytes16"
			},
			{
				"indexed": false,
				"internalType": "bytes16",
				"name": "blob_checksum",
				"type": "bytes16"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "req_id",
				"type": "uint256"
			}
		],
		"name": "RequestAddition",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes16",
				"name": "blob_id",
				"type": "bytes16"
			}
		],
		"name": "RequestGranted",
		"type": "event"
	}
]`
);

const addition_contract = new ethers.Contract(addition_contract_address, addition_contract_abi, signer)


const url_params = new URLSearchParams(location.search);
const blob_uuid = url_params.get('blob_uuid');

$('#submit_btn').click(async () => {
  const patient_aadhaar = $('#patient_aadhaar').val();

  let patient_wallet_address =
  await (async () => {
    const response = await fetch('/get_patient?' + new URLSearchParams({ patient_aadhaar }));
  
    if (!response.ok) {
      const { error_reason } = await response.json();
      alert(error_reason);
      return null;
    }

    return (await response.json()).wallet_address;
  })();
  if (patient_wallet_address == null) {
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

  try {
    console.log(patient_wallet_address, blob_uuid, checksum);
    const transaction_response 
     = await addition_contract.Request(
      patient_wallet_address,
      '0x' + blob_uuid,
      '0x' + checksum
    );
    console.log(transaction_response);
  } catch(err) {
    alert(err);
    return;
  }

  alert('Patient Record Recorded');
  $(location).prop('href', '/activity');  
});