export interface AuthSessionSnapshot {
  token: string | null;
  generation: number;
}

let generation = 0;
let knownToken = typeof localStorage === 'undefined' ? null : localStorage.getItem('authToken');

export function getAuthSession(): AuthSessionSnapshot {
  const token = localStorage.getItem('authToken');
  if (token !== knownToken) {
    knownToken = token;
    generation += 1;
  }
  return { token, generation };
}

export function emitAuthSessionChanged(token: string | null): AuthSessionSnapshot {
  knownToken = token;
  generation += 1;
  const session = { token, generation };
  window.dispatchEvent(new CustomEvent('auth:session-changed', {
    detail: { generation },
  }));
  return session;
}

export function isCurrentAuthSession(session: AuthSessionSnapshot): boolean {
  const current = getAuthSession();
  return current.generation === session.generation && current.token === session.token;
}
