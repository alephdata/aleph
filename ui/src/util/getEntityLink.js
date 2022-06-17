// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import getProfileLink from './getProfileLink';

export default function getEntityLink(entity, profile = true) {
  if (profile && entity?.profileId) {
    return getProfileLink(entity.profileId, { via: entity.id });
  }
  const entityId = typeof entity === "string" ? entity : entity?.id;
  const fragment = !profile ? '#profile=false' : '';
  return entityId ? `/entities/${entityId}${fragment}` : null;
}
