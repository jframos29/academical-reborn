const auth = {
  token: null,
  tokenTimeout: null,
  user: null,
  refreshToken: null,
}

export const saveAuth = authT => {
  const timeout = authT.tokenTimeout
  const dateEnd = new Date(new Date().getTime() + timeout * 60 * 60 * 1000)
  authT.tokenTimeout = dateEnd

  // eslint-disable-next-line no-unused-vars
  for (const index in authT) {
    localStorage.setItem(index, JSON.stringify(authT[index]))
  }
}

export const loadAuthFromLS = () => {
  auth.token = localStorage.getItem('token')
  if (auth.token) {
    // eslint-disable-next-line no-unused-vars
    for (const index in auth) {
      auth[index] = JSON.parse(localStorage.getItem(index))
    }
    if (auth.tokenTimeout < new Date()) {
      // eslint-disable-next-line no-unused-vars
      for (const index in auth) {
        auth[index] = null
        localStorage.removeItem(index)
      }
    }
  } else {
    auth.token = null
  }
  return auth
}

export const logout = () => {
  // eslint-disable-next-line no-unused-vars
  for (const index in auth) {
    localStorage.removeItem(index)
  }
}
