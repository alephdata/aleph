<!--
SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc

SPDX-License-Identifier: MIT
-->

# How to Contribute

Welcome friend.

If you are reading this document then we're assuming you are looking for ways that you can help contribute to the devlopment of Aleph. Thank you, we really appreciate it! This document has been created to serve as a guide to help you navigate your way to your first contribution. Please read on to learn more.

Aleph is an open source project, and is under active development. We are always striving to make this project as easy, open, and transparent as possible for external contributors but we've got a long way to go. This document seeks to outline the best way to get started with contributing to Aleph, and will hopefully answer some of the questions that you may have.

## Code of Conduct

The Aleph team have adopted the [contributor covenant](https://www.contributor-covenant.org/) as the basis for its code of conduct and we expect all contributors to adhere to it. Please take some time to read the [code of conduct](https://github.com/alephdata/aleph/blob/main/CODE_OF_CONDUCT.md) so that you can understand what is expected of you and what will happen if you do something which is not tolerated.

## How to get support

If you're trying to install Aleph and need help, or if you are running Aleph and are experiencing problems then please:

1. [Read the Aleph Support Policy](https://github.com/alephdata/aleph/blob/main/SUPPORT.md) and understand under what
   rules we provide support to others. If you feel you fall within that
   group, please [get in touch](https://docs.alephdata.org/get-in-touch).

2. Make sure you've [read the documentation](https://docs.alephdata.org),
   especially the technical troubleshooting sections.

3. Only once you're **certain that the problem you are seeing is a bug**
   (and not a local configuration issue), file a report on GitHub for it.

## Working on issues

### Find the right task

If this is your first time working on Aleph then it's probably a good idea to pick something easy to work on. To do this you can filter our open issues by label and look for 'good first issue', these issues should not be too challenging to work on but will certainly help benefit the community and the product. You can also find these issues on our [contribute page](https://github.com/alephdata/aleph/contribute).

If, after reviewing the list you'd like to reach out and talk to us then [get in touch](https://docs.alephdata.org/get-in-touch).

For more experienced developers we have a range of different labels that we use to try and compartmentalize our issues. To check the full list of labels [check the labels page on github](https://github.com/alephdata/aleph/labels).

### Forking and Branching

All new development work needs to happen on a branch. If this is your first time, you'll not have the ability to create branches directly from Aleph so will need to fork the repo. Once you've done this create an issue branch and commit all you changes to this.

### Pull Requests

Like most teams we use pull requests to review code before accepting it into our codebase. Once you finished working on your issue you can create a pull request from your branch. We merge all work from issue branches into our 'develop' branch. This is then used for our staging server where we perform manual and automated smoke testing before finally committing changes to the 'main' branch in order to release a new version of Aleph.

## Development practices

### Versioning

The Aleph team try to follow the concepts of semantic versioning. This means that we'll release patch versions for bugfixes, minor versions for new features and non breaking changes to existing functionality and major versions for large features and breaking changes.

All significant changes are recorded in our [changelog file](https://github.com/alephdata/docs/blob/master/developers/changelog.md)

### Branches

Aleph uses two main branches. The **develop** branch is for any new work that needs to be merged into Aleph. If you have bugfixes, features, or any other changes you should open a pull request to the **develop** branch. As part of our release process we will merge all changes made to develop into the main branch just before a new release of the product. The main branch is designated as stable and should not be committed to directly.

### Bugs, Features, and Raising Issues

Not everyone that is involved in the community is a hardened developer. If you want to contribute by providing feedback on Aleph, whether highlighting bugs or other issues, raising questions, or providing insights on potential new features then we'd really appreciate your help.

We use github issues for all our public facing work. We try to keep a close eye on this, to respond to questions, and to make it clear when we pick up and start working on the issues that we raise.

#### Known issues

Before you raise a new issue, please take a few minutes to review the existing issues and to check that someone else hasn't already created something. If they have, please feel free to comment on that issue, add your own thoughts and experiences, and highlight the importance of the issue for us.

#### Stale issues

We're a small team, and as such we only have a limited amount of time to deal with and address issues. The unfortunate fact of the matter is that we probably aren't going to implement every feature and fix every bug. With this in mind we'll periodically review our open issues and close out any that we believe we aren't going to be able to get to. If you feel strongly that we've made a mistake in closing out one of these issue feel free re-open it along with a comment explaining why you feel the issue should be addressed.

#### Reporting new issues

If you've looked around but are unable to find an issue that fits the experience that you are having please raise an issue for us. When creating a issue, especially a bug report, take the time to provide as much detail as possible. Ideally if you can provide a list of steps that will help us to reproduce the issue you are seeing.

When creating a bug report please add the 'bug' label so that we know to treat it as such.

#### Security issues

If you believe that the issue you have found has security implications then please add a security label so that we can properly review the issue and deal with it accordingly. For more information on security issues [check our security docs](https://github.com/alephdata/aleph/blob/main/SECURITY.md)

#### Feature requests

If you have an idea for a feature, or change in functionality that you'd like to see in Aleph then please create an issue with the 'feature-request' label along with a description and why you think it would be valuable to Aleph
