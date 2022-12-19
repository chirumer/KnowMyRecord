
// TEMPORARY ONLY
const users = new Map();

// TEMPORARY ONLY
add_user('0x116cf7154d2ff2a97dbb2336799a5a1612985b45', { authorization_status: 'authorized', user_type: 'admin', name: 'Admin User' });
add_user('0xCd5FFC1A56244F9b21A72CD6cD73adBa90e8B490', { authorization_status: 'pending', user_type: 'patient', name: 'Dan Arnin' });
add_user('0x7f40F621BdA647B841728eE9Ab8b1F9B661745edD', { authorization_status: 'pending', user_type: 'hospital', name: 'Assure Hospital' });

// get user information
export function get_user(wallet_address) {

  // TEMPORARY ONLY
  return users.get(wallet_address);
}

// get user type -> high access frequency, use RAM to store
export function get_user_type(wallet_address) {

  // TEMPORARY ONLY
  return get_user(wallet_address)?.user_type;
}

// get username -> high access frequency, use RAM to store
export function get_username(wallet_address) {

  // TEMPORARY ONLY
  return get_user(wallet_address)?.name;
}

export function add_user(wallet_address, user_details) {

  // TEMPORARY ONLY
  users.set(wallet_address, user_details);
}

export function change_authorization_status(wallet_address, new_authorization_status) {

  // TEMPORARY ONLY
  get_user(wallet_address).authorization_status = new_authorization_status;
}

export function get_unverified_users() {

  // TEMPORARY ONLY
  const unverified_users = [];

  users.forEach((user_data, wallet_address) => {

    if (user_data.authorization_status == 'pending') {
      unverified_users.push({
        wallet_address,
        ...user_data
      });
    }
  });

  return unverified_users;
}