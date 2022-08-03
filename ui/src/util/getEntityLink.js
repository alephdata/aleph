import getProfileLink from './getProfileLink';

export default function getEntityLink(entity, profile = true) {
  if (profile && entity?.profileId) {
    return getProfileLink(entity.profileId, { via: entity.id });
  }
  const entityId = typeof entity === 'string' ? entity : entity?.id;
  const fragment = !profile ? '#profile=false' : '';
  return entityId ? `/entities/${entityId}${fragment}` : null;
}
