# End to end tests

These tests use [Playwright](https://playwright.dev/python) to simulate a user clicking through the UI of Aleph.

### Running locally

1. Install the dependencies from `requirements-dev.txt` into your virtualenv (`make dev` in your virtualenv)
2. Run `make e2e-local-setup` to have playwright install supported browsers
3. Use `make e2e-local` to run the tests locally. This requires Aleph running locally.
4. Use `make e2e` to run the tests in a Docker environment. Everything required will be set up before the tests run.
5. You might find `playwright codegen` useful for generating test code.
6. Debug tests visually using `PWDEBUG=1 make e2e-local`
7. Setting the `BASE_URL` allows one to point to a different base URL where Aleph is expected to run.
