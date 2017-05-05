const documentsFactory = require('./factories/document');
const _ = require('lodash');

module.exports = () => {
  return {
    documents: _.times(25, (i) => {
      const model = documentsFactory();
   
      return Object.assign({}, { id: i }, model);
    })
  };
}