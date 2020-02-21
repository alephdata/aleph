import queryString from 'query-string';

const REPORTS_TYPE = 'ProcessingTaskReports';

const getJumpToQuery = ({ query, context }) => {
  let newQuery = query.clone();
  // eslint-disable-next-line
  Object.keys(context).map((k) => {
    newQuery = newQuery.setFilter(k, context[k]);
  });
  return newQuery;
};

const jumpToDetails = ({ query, context, location, history }) => {
  const newQuery = getJumpToQuery({ query, context });
  const hash = queryString.parse(location.hash);
  hash.type = REPORTS_TYPE;
  history.push({
    pathname: location.pathname,
    search: newQuery.toLocation(),
    hash: queryString.stringify(hash),
  });
};

export { jumpToDetails };
