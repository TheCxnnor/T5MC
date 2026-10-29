export async function withProfileLock<T>(
  action: () => T | Promise<T>,
): Promise<T> {
  if (navigator.locks)
    return navigator.locks.request("t5-minecraft-profiles", action);
  return action();
}
export function profilesChanged() {
  window.dispatchEvent(new Event("t5-profiles-changed"));
}
