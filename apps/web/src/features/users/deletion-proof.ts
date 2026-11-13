// One-shot, in-memory proof that this client session just saw a server-confirmed
// account deletion. Never a URL parameter or browser storage: a reload or a
// direct visit to /goodbye has no proof and must not claim deletion.
let confirmed = false;

export function markDeletionConfirmed() {
  confirmed = true;
}

export function hasDeletionProof() {
  return confirmed;
}

export function consumeDeletionProof() {
  confirmed = false;
}
