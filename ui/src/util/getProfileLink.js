// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import queryString from 'query-string';

export default function getProfileLink(profileId, hashQuery) {
    const fragment = queryString.stringify(hashQuery || {});
    return `/profiles/${profileId}#${fragment}`;
}
