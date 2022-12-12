// wallet -> { nonce, expiration }
export const nonces = new Map();

// get user from token
export function user_from_token(token) {
  if (!token) {
    return null;
  }
  try {
    const data = jwt.verify(token, process.env.TOKEN_SECRET);
    return data.wallet_address;
  }
  catch {
    return null;
  }
}

// get user information
export function get_user(wallet_address) {

  // example user object
  return {
    // all users have these
    type: 'patient',
    name: 'chiru sharma',
    public_address: wallet_address,

    // specific to type 'patient'
    aadhaar: '397788000234',
  }
}

