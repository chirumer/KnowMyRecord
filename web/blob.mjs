import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import path from 'path'
import fs from 'fs';
import { randomUUID } from 'crypto';


const blob_infos = new Map();
const blob_access_list = new Map();

// get blob
export function get_blob_info(blob_uuid) {
  return blob_infos.get(blob_uuid);
}

export function blob_access(wallet_address, blob_uuid) {

  const blob_info = get_blob_info(blob_uuid);

  if (blob_info == undefined) {
    return { can_access: false, denied_access_reason: 'Blob does not exist.' };
  }

  if (blob_info.verification_status == 'unverified' && Date.now() >= blob_info.expires_at) {
    return { can_access: false, denied_access_reason: 'Blob has expired (no patient confirmation).' };
  }

  // patient and hospital always have access
  if (wallet_address == blob_info.owner || wallet_address == blob_info.patient) {
    return { can_access: true };
  }

  access_list = blob_access_list.get(wallet_address);
  if (access_list != undefined && access_list.includes(blob_uuid)) {
    return { can_access: true };
  }

  return { can_access: false, denied_access_reason: 'No permission to access Blob' };
}

export async function add_unverified_blob(_blob_info) {
  const { blob_uuid, file, file_name, owner} = _blob_info;

  const blob_name = randomUUID();
  const expires_at = Date.now() + 1000 * 60 * 20 // 20 min from creation

  // upload file
  fs.writeFileSync(path.join(__dirname, `blobs/${blob_name}`), fs.readFileSync(file.path))

  const blob_info = { 
    file_name,
    verification_status: 'unverified',
    owner,
    blob_name,
    expires_at
  };

  blob_infos.set(blob_uuid, blob_info);
}