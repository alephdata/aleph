var alephNetwork = alephNetwork || {};

alephNetwork.Grid = function(scene) {
  var self = this;
  self.scene = scene;
  self.edgePaths = {};
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
    return (node.gridX * self.unit); // - (self.nodeWidth(node) / 2);
  };

  self.nodeY = function(node) {
    return (node.gridY * self.unit); // - (self.nodeHeight(node) / 2);
  };

  self.nodeOffsetX = function(node) {
    return (self.nodeWidth(node) / 2) * -1;
  };

  self.nodeOffsetY = function(node) {
    return (self.nodeHeight(node) / 2) * -1;
  };

  self.nodeTranslate = function(node) {
    if (node.gridX === null && node.gridY === null)  {
      node = self.placeNode(node);
    }
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
    node.gridX = self.pixelToUnit(node.x);
    node.gridY = self.pixelToUnit(node.y);
    node = self.placeNode(node);
  };

  self.placeNode = function(node) {
    var iter = 1,
        ref = self.scene.gridRef(),
        options = [[1, 0], [1, 1], [0, 1], [-1, 0],
                   [0, -1], [-1, -1], [-1, 1], [1, -1]];
    node.gridX = node.gridX || ref.gridX;
    node.gridY = node.gridY || ref.gridY;  
    if (!self.hasOverlap(node)) {
      return node;
    }
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
    for (var i in self.scene.nodes) {
      var on = self.scene.nodes[i];
      if (on.id != node.id) {
        var other = self.getNodeBox(self.scene.nodes[i]);
        if (!(box.left > other.right || box.right < other.left ||
              box.top > other.bottom || box.bottom < other.top)) {
          return true;
        }
      }
    }
    return false;
  };

  self.computePaths = function() {
    // var matrix = self.getGridMatrix();

    // for (var i in self.scene.edges) {
    //   var edge = self.scene.edges[i],
    //       route = new SceneGridRouter(matrix, edge.source, edge.target)
    //   self.edgePaths[edge.id] = route.path();
    // }
  };

  self.edgePath = function(edge) {
    var source = [edge.source.x, edge.source.y],
        target = [edge.target.x, edge.target.y];
    return 'M' + source + 'L' + target;
    // var path = self.edgePaths[edge.id].map(function(n) {
    //   return [n.x * self.unit, n.y * self.unit];
    // });
    // return 'M' + path.join('L');
  };

  self.getGridMatrix = function() {
    var matrix = {};
    for (var i in self.scene.nodes) {
      var box = self.getNodeBox(self.scene.nodes[i]);
      // todo: make a version that emits units.
      box.left = self.pixelToUnit(box.left);
      box.right = self.pixelToUnit(box.right);
      box.top = self.pixelToUnit(box.top);
      box.bottom = self.pixelToUnit(box.bottom);
      for (var col = box.left; col <= box.right; col++) {
        if (!matrix[col]) {
           matrix[col] = {};
        }
        for (var row = box.top; row <= box.bottom; row++) {
          matrix[col][row] = self.scene.nodes[i].id;
        }
      }
    }
    return matrix;
  };
};
