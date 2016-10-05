var loadCollections = ['$q', '$http', '$location', 'Collection', function($q, $http, $location, Collection) {
  return Collection.search({
    counts: true,
    facet: ['countries', 'category']
  });
}];
