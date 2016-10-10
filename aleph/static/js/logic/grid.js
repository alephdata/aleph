var alephNetwork = alephNetwork || {};

alephNetwork.Grid = function(network) {
  var self = this;
  self.network = network;
  self.unit = 20;
  self.nodeWidthUnits = 6;
  self.nodeHeightUnits = 2;

  self.nodeWidth = function(node) {
    return self.nodeWidthUnits * self.unit;
  };

  self.nodeHeight = function(node) {
    return self.nodeHeightUnits * self.unit;
  };

  self.fontSize = function() {
    return self.unit * 0.6;
  };

  self.nodeX = function(node) {
    return (node.gridX * self.unit);
  };

  self.nodeY = function(node) {
    return (node.gridY * self.unit);
  };

  self.nodeOffsetX = function(node) {
    return (self.nodeWidth(node) / 2) * -1;
  };

  self.nodeOffsetY = function(node) {
    return (self.nodeHeight(node) / 2) * -1;
  };

  self.nodeTranslate = function(node) {
    node = self.placeNode(node);
    node.x = self.nodeX(node);
    node.y = self.nodeY(node);
    return 'translate(' + [node.x, node.y] + ')';
  };

  self.edgeLabelTranslate = function(edge) {
    var x = (edge.source.x + edge.target.x) / 2;
    var y = (edge.source.y + edge.target.y) / 2;
    return 'translate(' + [x, y] + ')';
  };

  self.pixelToUnit = function(px) {
    return Math.round(px / self.unit);
  };

  self.snapToGrid = function(node) {
    if (node.x && node.y) {
      node.gridX = self.pixelToUnit(node.x);
      node.gridY = self.pixelToUnit(node.y);
    }
    self.placeNode(node);
    // console.log(JSON.stringify(node.toJSON()));
  };

  self.findEmtpyPosition = function(node) {
    var iter = 1,
        options = [[ 1, 0], [0,  1], [-1,  0], [0, -1], 
                   [-1, 1], [1, -1], [-1, -1], [-1, 1]];
    while (true) {
      for (var i in options) {
        var pos = {
          id: node.id,
          gridX: node.gridX + (options[i][0] * iter * self.nodeWidthUnits),
          gridY: node.gridY + (options[i][1] * iter * self.nodeHeightUnits),
        };
        if (!self.hasOverlap(pos)) {
          node.gridX = pos.gridX;
          node.gridY = pos.gridY;
          return node;
        }
      };
      iter += 1;
    }
  };

  self.placeNode = function(node) {
    if (!node.isPlaced()) {
      var ref = node.gridRef ? node.gridRef : self.network.gridRef();
      node.gridX = ref.gridX || 0;
      node.gridY = ref.gridY || 0;
    }
    if (self.hasOverlap(node)) {
      node = self.findEmtpyPosition(node);
    }
    return node;
  };

  self.getNodeBox = function(node) {
    var offsetX = self.nodeOffsetX(node),
        offsetY = self.nodeOffsetY(node);
    return {
      left: self.nodeX(node) + offsetX,
      right: self.nodeX(node) + (offsetX * -1),
      top: self.nodeY(node) + offsetY,
      bottom: self.nodeY(node) + (offsetY * -1),
    };
  };

  self.hasOverlap = function(node) {
    var box = self.getNodeBox(node);
    for (var i in self.network.nodes) {
      var on = self.network.nodes[i];
      if (on.id != node.id) {
        var other = self.getNodeBox(self.network.nodes[i]);
        if (!(box.left > other.right || box.right < other.left ||
              box.top > other.bottom || box.bottom < other.top)) {
          return true;
        }
      }
    }
    return false;
  };

  self.edgePath = function(edge) {
    var source = [edge.source.x, edge.source.y],
        target = [edge.target.x, edge.target.y];
    return 'M' + source + 'L' + target;
  };
};
