var alephNetwork = alephNetwork || {};

alephNetwork.Node = function(scene, node) {
  // A node represents one object (person, company, phone, email, ...)
  // on the graph. This object is just interested in layout and grid
  // positioning, not the actual management of the scene canvas.
  var self = this;
  self.scene = scene;
  self.data = node;
  self.type = node.alephSchema || node.$label;
  self.name = node.name;
  self.gridX = node.gridX || null;
  self.gridY = node.gridY || null;
  self.id = node.id;

  self.getColor = function() {
    return scene.config.colors[self.type] || '#777777';
  };

  self.getIcon = function() {
    return scene.config.icons[self.type] || '\uf0c8';
  };

  self.toJSON = function() {
    return {
      id: self.id,
      gridX: self.gridX,
      gridY: self.grifY
    };
  };
};
