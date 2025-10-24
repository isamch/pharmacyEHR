export function getPagination(query, defaultLimit = 10) {
  const page = parseInt(query.page) || 1;
  const perPage = parseInt(query.limit) || defaultLimit;
  const skip = (page - 1) * limit;

  return { page, perPage, skip };
}

