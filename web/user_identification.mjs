import jwt from 'jsonwebtoken';


// wallet -> { nonce, expiration }
export const nonces = new Map();

// get user from token
export function wallet_address_from_token(token) {
  if (token == undefined) {
    return null;
  }
  try {
    const data = jwt.verify(token, process.env.TOKEN_SECRET);
    return data.wallet_address;
  }
  catch {
    console.log(err);
    return null;
  }
}

// authorize middleware 
export function authorize(req, res, next) {
  const wallet_address = wallet_address_from_token(req.cookies.access_token);
  if (wallet_address) {
    req.wallet_address = wallet_address;
    next();
  }
  else {
    res.status(403).end();
  }
}

// TEMPORARY ONLY
const users = new Map();

// get user information
export function get_user(wallet_address) {

  // TEMPORARY ONLY
  return users.get(wallet_address);
}

export function add_user(wallet_address, user_details) {

  // TEMPORARY ONLY
  users.set(wallet_address, user_details);
}