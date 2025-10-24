export const sendCookies = (res, cookie) => {

  // cookie: { name, value, options }

  if (!cookie || !cookie.name || !cookie.value) return;

  res.cookie(cookie.name, cookie.value, cookie.options || {});

};


export const clearCookie = (res, name, options = {}) => {

  return res.clearCookie(name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    ...options,
  });
  
};