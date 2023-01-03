// load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config()

import ethers from 'ethers';
import { contract_abis, contract_addresses } from './contract_infos.mjs';
import { verify_blob } from './blob.mjs'
import { add_to_user_activity, get_username  } from './users.mjs'


const provider = new ethers.providers.WebSocketProvider(
  process.env.BLOCKCHAIN_PROVIDER_URL
);

const addition_contract = new ethers.Contract(contract_addresses.addition_contract, contract_abis.addition_contract, provider);
addition_contract.on('RequestAddition', (patient, hospital, blob_id, blob_checksum, req_id) => {

  add_to_user_activity(hospital, { 
    event: 'Record Addition Request',
    timestamp: Date.now(),
    patient_aadhaar: get_username(patient),
    blob_id,
    blob_checksum,
    req_id
  });

  add_to_user_activity(patient, { 
    event: 'Record Addition Request',
    timestamp: Date.now(),
    hospital: get_username(hospital),
    blob_id,
    blob_checksum,
    req_id
  });
});