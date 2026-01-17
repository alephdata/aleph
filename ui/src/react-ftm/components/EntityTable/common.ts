import type { Entity } from '@alephdata/followthemoney';
import type { WrappedComponentProps } from 'react-intl';

import type { EntityManager } from '/src/react-ftm/components/common/index.ts';
import type { EntityChanges } from '/src/react-ftm/components/common/types/index.tsx';

export interface IEntityTableCommonProps extends WrappedComponentProps {
  entityManager: EntityManager;
  visitEntity?: (entity: Entity | string) => void;
  updateFinishedCallback?: (entityChanges: EntityChanges) => void;
  writeable: boolean;
  isPending?: boolean;
}
