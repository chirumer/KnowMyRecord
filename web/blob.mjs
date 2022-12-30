import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import path from 'path'
import fs from 'fs';


// TEMPORARY ONLY
const blob_infos = new Map();

// get blob
export function get_blob_info(blob_uuid) {

  // TEMPORARY ONLY
  return blob_infos.get(blob_uuid);
}

// if blob exists
export function blob_exists(blob_info) {
  return blob_info != null;
}

// is blob timed out
export function blob_timed_out(blob_info) {
  return blob_info.expiry_time >= Date.now();
}

// verify ownership of blob
export function is_owner_of_blob(wallet_address, blob_info) {
  return wallet_address == blob_info.owner;
}

// is blob unverified
export function is_blob_unverified(blob_info) {
  return blob_verification_status == 'unverified';
}

export async function add_unverified_blob(_blob_info) {
  const { blob_uuid, file, file_name, owner} = _blob_info;

  // upload file
  fs.writeFileSync(path.join(__dirname, `temp/blobs/${blob_uuid}`), fs.readFileSync(file.path))

  const blob_info = { 
    file_name,
    verification_status: 'unverified',
    owner
  };

  // TEMPORARY ONLY
  blob_infos.set(blob_uuid, blob_info);
}