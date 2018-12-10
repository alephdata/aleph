describe('The Login Page', function () {
  beforeEach(function () {
    // reset and seed the database prior to every test
    // cy.exec('npm run db:reset && npm run db:seed')

    // seed a user in the DB that we can control from our tests
    // assuming it generates a random password for us
    // cy.request('POST', '/test/seed/user', { username: 'jane.lane' })
    //   .its('body')
    //   .as('currentUser')
  })

  it('sets auth cookie when logging in via form submission', function () {
    // destructuring assignment of the this.currentUser object
    // const { username, password } = this.currentUser
    cy.server();
    cy.route('/api/2/metadata', 'fixture:metadata').as('getMetadata');
    cy.route('/api/2/statistics', 'fixture:statistics').as('getStatistics');
    cy.route({
      url:'/api/2/sessions/login',
      method:'POST',
      status:200,
      headers:{
        "x-aleph-session": "576f65a8-bab2-4e59-ba3f-a866482b2470"
      },
      response:{
        token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6NCwiZXhwIjoxNTQ0MjgxMjAxLCJyb2xlcyI6WzEsMiw0XSwiaXNfYWRtaW4iOnRydWUsInJvbGUiOnsiaXNfbXV0ZWQiOm51bGwsImFwaV9rZXkiOiJjZjIwMGIzNTBhNDU0OGJjYjNhMTAwNjZmMTEzNjJkYSIsImxhYmVsIjoiYW1lPUFsaWNlIDx1KioqQGV4YW1wbGUuY29tPiIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlkIjoiNCIsInR5cGUiOiJ1c2VyIiwiaGFzX3Bhc3N3b3JkIjp0cnVlLCJuYW1lIjoiYW1lPUFsaWNlIiwid3JpdGVhYmxlIjp0cnVlLCJsaW5rcyI6eyJzZWxmIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwL2FwaS8yL3JvbGVzLzQifX19.bZ_5la8W89vznqyqi6gu_slz9_LaJlKCgQpjsOqx6-Q"
        }
    }).as('loginRequest');
    cy.visit('/');

    cy.wait(['@getMetadata', '@getStatistics']);
    cy.get('.AuthButtons>button').click();
    cy.get('input[name=email]:visible').type('users@example.com');

    // {enter} causes the form to submit
    cy.get('input[name=password]').type(`123abc{enter}`)
    cy.wait(['@loginRequest', '@getStatistics','@getMetadata'])

    cy.get('.AuthButtons>button').should('not.to.exist');
    
  })
})