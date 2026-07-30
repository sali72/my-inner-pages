export interface AuthSessionSnapshot {
  generation: number;
}

let generation = 0;

export function getAuthSession(): AuthSessionSnapshot {
  return { generation };
}

export function emitAuthSessionChanged(hasSession?: boolean): AuthSessionSnapshot {
  generation += 1;
  const session = { generation };
  window.dispatchEvent(new CustomEvent('auth:session-changed', {
    detail: { generation, hasSession },
  }));
  return session;
}

export function isCurrentAuthSession(session: AuthSessionSnapshot): boolean {
  return generation === session.generation;
}
