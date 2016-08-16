var alephNetwork = alephNetwork || {};

alephNetwork.GridRouter = function(nodeMatrix, source, target) {
  var self = this
      // moveOptions = [[1, 0], [0, 1], [-1, 0], [0, -1]]
      moveOptions = [[1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [-1, -1], [-1, 1], [1, -1]],
      deadPoints = [];
  self.sourcePt = new alephNetwork.Point(source.gridX, source.gridY);
  self.targetPt = new alephNetwork.Point(target.gridX, target.gridY);

  self.getPenalty = function(point) {
    // apply penalties to points that overlap with nodes.
    var nodes = nodeMatrix[point.x];
    if (nodes) {
      var nodeId = nodes[point.y];
      if (nodeId) {
        if (nodeId != source.id && nodeId != target.id) {
          return 100;
        }
        return 2;
      }
    }
    return 1;
  };

  self.followPath = function(path) {
    var lastPoint = path[path.length - 1];
    while (true) {
      var bestDistance = Infinity,
          bestOption = null;
      for (var o in moveOptions) {
        // this tries out all the possible move options, i.e. up down left right
        // each one is assigned a cost based on whether the next step is inside a
        // node, or a "course change".
        var opt = moveOptions[o],
            nextPoint = new alephNetwork.Point(lastPoint.x + opt[0], lastPoint.y + opt[1]),
            nextDistance = nextPoint.distance(self.targetPt) * self.getPenalty(nextPoint);
        if (nextPoint.is(self.targetPt)) {
          return path;
        }
        // if (path.length > 1) {
        //   var prevPoint = path[path.length - 2];
        //   if (prevPoint.x != nextPoint.x && prevPoint.y != nextPoint.y) {
        //     nextDistance += 0.8;
        //   }
        // }
        if (nextDistance < bestDistance) {
          // check if the point has been excluded from further path-finding.
          // check if the given point is already on the path.
          if (!nextPoint.inArray(deadPoints)) {
            bestOption = nextPoint;
            bestDistance = nextDistance;
          }
        }
      };
      if (bestOption == null || bestOption.inArray(path)) {
        deadPoints.push(lastPoint);
        return null;
      }
      var nextPath = self.followPath(path.concat([bestOption]));
      if (nextPath != null) {
        return nextPath;
      }
    }
  };

  self.path = function() {
    return self.followPath([self.sourcePt]);
  };
};
