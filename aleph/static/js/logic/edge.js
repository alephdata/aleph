var alephNetwork = alephNetwork || {};

alephNetwork.Edge = function(scene, edge, source, target) {
  // An edge represents a connection between two nodes. It is
  // directed.
  var self = this;
  self.scene = scene;
  self.data = edge;
  self.type = edge.$type;
  self.source = source;
  self.target = target;
  self.id = edge.id;

  self.toJSON = function() {
    return {id: self.id};
  };
};
