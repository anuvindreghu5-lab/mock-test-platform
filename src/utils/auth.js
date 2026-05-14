export const getToken = () => localStorage.getItem("access_token");

export const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const getUser = () => {
  const user = localStorage.getItem("user");

  if (!user || user === "undefined") {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch (e) {
    return null;
  }
};

export const setUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};