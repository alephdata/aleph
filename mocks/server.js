const jsonServer = require('json-server');
const pause = require('connect-pause')
const generator = require('./generate');
const qs = require('query-string');

const server = jsonServer.create();
const router = jsonServer.router(generator());
const middlewares = jsonServer.defaults();

router.render = (req, res) => {
  const params = qs.parse(req._parsedUrl.search);
  if (req.method === 'GET' && req._parsedUrl.pathname === '/documents') {
    let results = res.locals.data;

    if (params.search) {
      results = results.filter((item) => item.title.includes(params.search));
    }

    res.jsonp({
      "total": results.length,
      "page": 1,
      "offset": 0,
      "limit": 25,
      "pages": 223830,
      results: results
    })
  } else {
    res.jsonp(res.locals.data);
  }
}

server.use(middlewares)
server.use(pause(500))
server.use(jsonServer.rewriter({
  '/api/': '/'
}))
server.use(router)
server.listen(3001, () => {
  console.log('JSON Server is running')
})