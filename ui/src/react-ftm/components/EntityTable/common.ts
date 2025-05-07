import type { Entity } from '@alephdata/followthemoney';
import type { WrappedComponentProps } from 'react-intl';

import type { EntityManager } from 'react-ftm/components/common';
import type { EntityChanges } from 'react-ftm/components/common/types';

export interface IEntityTableCommonProps extends WrappedComponentProps {
  entityManager: EntityManager;
  visitEntity?: (entity: Entity | string) => void;
  updateFinishedCallback?: (entityChanges: EntityChanges) => void;
  writeable: boolean;
  isPending?: boolean;
}
