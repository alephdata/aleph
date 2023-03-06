# End to end tests

These tests use [Playwright](https://playwright.dev/python) to simulate a user clicking through the UI of Aleph.

### Running locally

1. Install the dependencies from `requirements.txt` into your virtualenv (`make dev` in your virtualenv)
2. Run `make e2e-local-setup` to have playwright install supported browsers
3. Use `make e2e-local` to run the tests locally.
4. You might find `playwright codegen` useful for generating test code.
5. Debug tests visually using `PWDEBUG=1 make e2e-local`
