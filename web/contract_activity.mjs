import { update_user_activity_socket, update_hospital_authorization_socket} from './sockets.mjs';

const user_activity = new Map();

export function add_to_user_activity(wallet_address, activity) {
  const activities = get_user_activity(wallet_address);
  activities.push(activity);
  user_activity.set(wallet_address, activities)
  update_user_activity_socket(wallet_address, activity);
}

export function get_user_activity(wallet_address) {
  return user_activity.get(wallet_address) ?? [];
}

const pending_requests = new Map();

export function add_pending_request(wallet_address, request_data) {
  const pending = pending_requests.get(wallet_address) ?? [];
  pending.push(request_data);
  pending_requests.set(wallet_address, pending);
  update_hospital_authorization_socket(wallet_address, request_data);
}

export function get_pending_requests(wallet_address) {
  return pending_requests.get(wallet_address) ?? [];
}

export function close_pending_requests(wallet_address, index) {
  const pending = pending_requests.get(wallet_address);
  pending.splice(index, 1);
  pending_requests.set(wallet_address, pending);
}