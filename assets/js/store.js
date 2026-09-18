export const state = {
  session: null,
  profile: null,
  courses: [],
  myCourses: [],
  unread: 0
};

export function setUser(session, profile) {
  state.session = session;
  state.profile = profile;
}

export function isAdmin()   { return state.profile?.role === 'admin'; }
export function isTeacher() { return state.profile?.role === 'teacher'; }
export function isStudent() { return state.profile?.role === 'student'; }
export function canManage() { return isAdmin() || isTeacher(); }
