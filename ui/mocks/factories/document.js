const faker = require('faker');

module.exports = () => {
  return {
    title: 'Doc: ' + faker.lorem.words()
  }
}