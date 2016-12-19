import {ensureArray} from './util';

var alephCore = alephCore || {};

alephCore.Schema = function(name, data) {
  this.data = data;
  this.name = name;
  this.label = data.label;
  this.plural = data.plural;
  this.type = data.type;
  this.icon = data.icon;
  this.properties = data.properties || [];
};

alephCore.Schema.prototype.bindData = function(data) {
  // bind property data to an actual object
  var binds = [];
  for (var i in this.properties) {
    var property = this.properties[i],
        values = ensureArray(data.properties[property.name]);
    if (values.length && !property.hidden) {
      binds.push({
        values: values,
        property: property
      });
    }
  }

  return binds.sort(function(a, b) {
    return a.property.label.localeCompare(b.property.label);
  });
};

alephCore.Schema.prototype.getLinkLabel = function(obj) {
  return obj.inverted ? this.data.reverse : this.data.forward;
};

export default alephCore;
