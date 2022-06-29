// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

export default function normalizeDegreeValue(value) {
  return value < 0 ? (360 + value) % 360 : value % 360;
}
