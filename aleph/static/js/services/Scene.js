
aleph.factory('Scene', ['Metadata', function(Metadata) {

  var Node = function(scene, props) {
    // A node represents one object (person, company, phone, email, ...)
    // on the graph. This object is just interested in layout and grid
    // positioning, not the actual layout of the scene canvas.
    var self = this;
    self.scene = scene;
    self.props = props;

    self.toJSON = function() {
      return self.props;
    };
  };

  var Scene = function(metadata, collection) {
    // A scene is a canvas of nodes and edges used in the context 
    // of an investigation (i.e. a collection).
    var self = this;
    self.metadata = metadata;
    self.collection = collection;
    self.nodes = [];
    self.edges = [];

    self.addNode = function(node) {
      // add the node to this scene.
      if (!(node instanceof Node)) {
        node = new Node(self, node);
      }
      self.nodes.push(node);
    };

    self.fromJSON = function(result) {
      for (var i in result.nodes) {
        var node = result.nodes[i];
        self.addNode(node); 
      }
    };

    self.toJSON = function() {
      return {
        nodes: self.nodes.map(function(n) {
          return n.toJSON();
        }),
        edges: self.edges.map(function(e) {
          return e.toJSON();
        })
      };
    };
  };

  return {
    new: function(metadata, collection) {
      return new Scene(metadata, collection);
    }
  };
}]);


