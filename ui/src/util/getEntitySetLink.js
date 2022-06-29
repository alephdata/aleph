// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

export default function getEntitySetLink(entitySet) {
  return (entitySet && entitySet.id) ? `/${entitySet.type}s/${entitySet.id}` : "";
}
