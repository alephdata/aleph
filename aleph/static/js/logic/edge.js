var alephNetwork = alephNetwork || {};

alephNetwork.Edge = function(scene, data, source, target) {
  // An edge represents a connection between two nodes. It is
  // directed.
  var self = this;
  self.scene = scene;
  self.data = data;
  self.type = data.$type;
  self.source = source;
  self.target = target;
  self.id = data.id;

  self.toJSON = function() {
    return {id: self.id};
  };
};
