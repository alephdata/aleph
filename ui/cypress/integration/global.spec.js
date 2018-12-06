describe('Muy first test', function(){
  it('Does not do much!',function(){
    cy.visit('https://example.cypress.io');
    cy.contains('type').click();
    cy.url().should('include', '/commands/actions')
  })
})