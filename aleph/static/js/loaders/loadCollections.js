var loadCollections = ['$q', '$http', 'Collection', function($q, $http, Collection) {
  var params = {params: {facet: 'collections'}, limit: 0};
  return $q.all([
    $http.get('/api/1/query', params),
    $http.get('/api/1/entities', params),
    Collection.index()
  ]).then(function(res) {
    var docFacet = res[0].data.facets.collections.values,
        entityFacet = res[1].data.facets.collections.values,
        docCounts = {},
        entityCounts = {},
        collections = res[2];

    for (var j in docFacet) {
      var bucket = docFacet[j];
      docCounts[bucket.id] = bucket.count;
    }

    for (var j in entityFacet) {
      var bucket = entityFacet[j];
      entityCounts[bucket.id] = bucket.count; 
    }

    for (var i in collections) {
      var collection = collections[i];
      collection.doc_count = docCounts[collection.id];
      collection.entity_count = entityCounts[collection.id];
    };
    return collections;
  });
}];
