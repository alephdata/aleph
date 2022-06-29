// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

import queryString from 'query-string';

export default function getProfileLink(profileId, hashQuery) {
    const fragment = queryString.stringify(hashQuery || {});
    return `/profiles/${profileId}#${fragment}`;
}
