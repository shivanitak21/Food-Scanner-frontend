export type AuthStart = 'Login' | 'Register';

let route: AuthStart = 'Login';

export const authIntent = {
  set(next: AuthStart) {
    route = next;
  },
  get(): AuthStart {
    return route;
  },
};
