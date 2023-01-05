// load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config()

import ethers from 'ethers';
import { contract_abis, contract_addresses } from './contract_infos.mjs';
import { verify_blob } from './blob.mjs';
import { get_user  } from './users.mjs';
import { add_to_user_activity, add_pending_request } from './contract_activity.mjs';


const provider = new ethers.providers.WebSocketProvider(
  process.env.BLOCKCHAIN_PROVIDER_URL
);

const addition_contract = new ethers.Contract(contract_addresses.addition_contract, contract_abis.addition_contract, provider);
addition_contract.on('RequestAddition', (patient, hospital, blob_id, blob_checksum, req_id) => {

  patient = patient.toLowerCase();
  hospital = hospital.toLowerCase();
  req_id = req_id.toNumber();

  const hospital_HIN = get_user(hospital).hin;
  const patient_aadhaar = get_user(patient).aadhaar;

  add_to_user_activity(hospital, { 
    event: 'Record Addition Request',
    timestamp: Date.now(),
    patient_aadhaar,
    blob_id,
    blob_checksum,
    req_id
  });

  add_to_user_activity(patient, { 
    event: 'Record Addition Request',
    timestamp: Date.now(),
    hospital_HIN,
    blob_id,
    blob_checksum,
    req_id
  });

  const hospital_name = get_user(hospital).name;
  const request = `${hospital_name} wants to add a patient record.`;
  const request_type = 'record addition';
  add_pending_request(patient, { request_type, request, hospital_HIN, blob_id, blob_checksum, req_id });
});