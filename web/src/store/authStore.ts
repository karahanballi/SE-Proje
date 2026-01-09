export type UserRole = "student" | "admin";

export type AuthState = {
  ok: boolean;
  username: string;
  role: UserRole;
};

const LS_KEY = "lms_auth_v1";

function load(): AuthState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ok: false, username: "", role: "student" };
    const v = JSON.parse(raw) as Partial<AuthState>;
    if (!v || typeof v !== "object") return { ok: false, username: "", role: "student" };
    return {
      ok: Boolean(v.ok),
      username: typeof v.username === "string" ? v.username : "",
      role: v.role === "admin" ? "admin" : "student",
    };
  } catch {
    return { ok: false, username: "", role: "student" };
  }
}

function save(state: AuthState) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

export const authStore = {
  get(): AuthState {
    return load();
  },
  login(username: string, role: UserRole) {
    save({ ok: true, username, role });
  },
  logout() {
    localStorage.removeItem(LS_KEY);
  },
  isAuthed(): boolean {
    return load().ok;
  },
  hasRole(role: UserRole): boolean {
    const a = load();
    return a.ok && a.role === role;
  },
};
