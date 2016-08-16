var alephNetwork = alephNetwork || {};

alephNetwork.GridPoint = function(x, y) {
  var self = this;
  self.x = x;
  self.y = y;

  self.distance = function(target) {
    return Math.sqrt(Math.pow(target.x - self.x, 2) + Math.pow(target.y - self.y, 2));
  };

  self.is = function(point) {
    return self.x == point.x && self.y == point.y;
  };

  self.inArray = function(points) {
    for (var i in points) {
      if (self.is(points[i])) {
        return true;
      }
    }
    return false;
  };
} 
