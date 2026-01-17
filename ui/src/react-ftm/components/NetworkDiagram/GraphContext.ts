import * as React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import type { GraphLayout } from './layout';
import type { Viewport } from './Viewport';
import type { EntityManager } from '/src/react-ftm/components/common/index.ts';

export type GraphUpdateHandler = (
  layout: GraphLayout,
  entityChanges?: any,
  options?: any
) => void;
export type ViewportUpdateHandler = (
  viewport: Viewport,
  transitionSettings?: any
) => void;

export interface IGraphContext extends WrappedComponentProps {
  layout: GraphLayout;
  updateLayout: GraphUpdateHandler;
  viewport: Viewport;
  updateViewport: ViewportUpdateHandler;
  entityManager: EntityManager;
  writeable: boolean;
  interactionMode: string;
}

export const GraphContext = React.createContext<IGraphContext | undefined>(
  undefined
);
