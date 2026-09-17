export const USER_TOKEN_KEY = 'stickshi-user'
export const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY) || ''
export const setUserToken = (t) => { if (t) localStorage.setItem(USER_TOKEN_KEY, t); else localStorage.removeItem(USER_TOKEN_KEY) }