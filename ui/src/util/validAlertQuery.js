// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

export default function validAlertQuery(query) {
    return query && query.trim().length >= 3 && query.length < 100;
}
