// Persistent anonymous session id, stored in localStorage.
const KEY = "teraplayer.session_id";

export function getSessionId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}
