# How to Contribute to OpenAleph

Welcome to the OpenAleph contributing guide, and thank you for your interest — we really appreciate it! This guide will help you navigate toward your first contribution.

OpenAleph is in active development and committed to being open, accessible, and transparent. We warmly welcome contributions from everyone, no matter if you are a seasoned developer or a beginner, and we’ll do our best to support you along the way.

---

## Table of Contents

- [How to Contribute to OpenAleph](#how-to-contribute-to-openaleph)
- [Code of Conduct](#code-of-conduct)
- [How to Get Support](#how-to-get-support)
- [Working on Issues](#working-on-issues)
  - [Find the Right Task](#find-the-right-task)
  - [Forking and Branching](#forking-and-branching)
  - [Pull Requests](#pull-requests)
- [Development Practices](#development-practices)
  - [Versioning](#versioning)
  - [Branches](#branches)
  - [Code Formatting and Linting](#code-formatting-and-linting)
- [Bugs, Features, and Raising Issues](#bugs-features-and-raising-issues)
  - [Known Issues](#known-issues)
  - [Stale Issues](#stale-issues)
  - [Reporting New Issues](#reporting-new-issues)
  - [Security Issues](#security-issues)
  - [Feature Requests](#feature-requests)

---

## Code of Conduct

The OpenAleph team has adopted the [Contributor Covenant](https://www.contributor-covenant.org/) as the basis for our Code of Conduct. We expect all contributors to review and adhere to these guidelines. Please take a moment to read the [Code of Conduct](CODE_OF_CONDUCT.md) so you know what is expected—and what steps are taken if any behavior falls outside these norms.

---

## How to Get Support

If you’re experiencing issues installing or running OpenAleph, please follow these steps:

1. **Review Documentation:**
   Make sure to check out our [documentation](https://openaleph.org/docs) and especially the technical troubleshooting sections to clear up common issues.

2. **Confirm a Bug Exists:**
   Please only file a report on GitHub after you’ve verified that the problem isn’t due to local configuration and truly appears to be a bug.

3. **Join Our Community:**
   Connect with other users, developers, and enthusiasts on our community platform [darc.social](https://darc.social) for real-time support, discussion, and sharing of ideas.

---

## Working on Issues

### Find the Right Task

A good way of starting is by looking at the [open project issues](https://github.com/dataresearchcenter/openaleph/issues). Once you’ve chosen an issue:

- **Assign it to yourself:** This prevents duplicate efforts and signals to others that the issue is actively being handled.
- **Reach Out if Needed:** If you need clarification or want to discuss the issue further, please [get in touch](https://darc.social).

### Forking and Branching

- **Fork the Repository:** If you’re new to the project, you might not have direct branch creation privileges. Fork the repo to your account.
- **Create a Dedicated Branch:** Once you have your fork, create an issue-specific branch to hold your work.
- **Commit Signing:** We encourage you to set up [commit signing](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits) to verify the authenticity of your changes.

### Pull Requests

Pull requests (PRs) are how we review and merge code:

- **Submit Your PR from Your Branch:** Once your work on an issue or feature is complete, create a pull request targeting our `develop` branch.
- **Review Process:** We will review your code changes and run the necessary tests to ensure that your code works well.
- **Merge Scheduling:** After passing all tests and code reviews, your changes will eventually be merged into the `main` branch as part of our release process.

---

## Development Practices

### Versioning

We align with the principles of semantic versioning:

- **Patch Versions:** For bug fixes.
- **Minor Versions:** For new features and backward-compatible enhancements.
- **Major Versions:** For large features or breaking changes.

All major changes are documented in our [changelog file](./CHANGELOG.md).

### Branches

OpenAleph uses two main branches:

- **`develop`:** This is the branch for all new work—features, bug fixes, and more.
- **`main`:** Our stable branch. Only thoroughly tested work from `develop` is merged here during releases.
- There may be other branches, for example for issues specific to a certain deployment.

### Code Formatting and Linting

To maintain a uniform codebase:

- **Python:** We use [Black](https://black.readthedocs.io/en/stable/) and [Ruff](https://beta.ruff.rs/).
- **JavaScript:** We rely on [Prettier](https://prettier.io) and [ESLint](https://eslint.org/).

Your pull requests will automatically be checked for code formatting and linting. You’re encouraged to run these checks locally before submitting your PR, but don’t worry if your initial changes need some tweaks.

---

## Bugs, Features, and Raising Issues

We value contributions beyond code changes too. Here are a few guidelines:

### Known Issues

- **Review Before Reporting:**
  Please check existing issues to ensure that the problem hasn’t been reported already. If it has, add your comments, thoughts, or upvotes to support it.

### Stale Issues

- **Periodic Review:**
  Given our limited resources, we sometimes close issues that aren’t actively pursued. If you believe a closed issue still merits discussion, don’t hesitate to re-open it with an explanation.

### Reporting New Issues

- **Detailed Bug Reports:**
  When reporting bugs, include a list of clear, reproducible steps. Add the 'bug' label so that we can prioritize appropriately.

### Security Issues

- **Sensitive Information:**
  If you discover a security vulnerability, include a security label. Refer to our [Security Documentation](SECURITY.md) for further guidance.

### Feature Requests

- **New Ideas Are Welcome:**
  Got an idea to enhance OpenAleph? Open an issue with the 'feature-request' label, describing in detail how the feature would benefit the project.

---

Thank you for considering a contribution to OpenAleph! Whether you’re fixing a bug, proposing a new feature, or simply offering feedback, your involvement makes a real difference. We’re excited to work together to improve the project for everyone.

Happy coding!
