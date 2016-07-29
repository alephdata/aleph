
aleph.factory('Scene', ['Metadata', function(Metadata) {

  var Scene = function(metadata, collection) {
    var self = this;
    self.metadata = metadata;
    self.collection = collection;
    self.nodes = [];
    self.edges = [];

    self.toJSON = function() {
      return {
        'nodes': self.nodes.map(function(n) { return n.toJSON(); }),
        'edges': self.edges.map(function(e) { return e.toJSON(); })
      };
    };
  };

  return {
    new: function(metadata, collection) {
      return new Scene(metadata, collection);
    }
  };
}]);


