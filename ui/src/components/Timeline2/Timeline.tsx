import { FC, useReducer, useState } from 'react';
import { Button, Intent } from '@blueprintjs/core';
import { Colors } from '@blueprintjs/colors';
import { Schema, Entity, Model } from '@alephdata/followthemoney';
import c from 'classnames';
import {
  reducer,
  selectSortedEntities,
  selectSelectedEntity,
  selectSelectedVertex,
} from './state';
import TimelineList from './TimelineList';
import EntityViewer2 from './EntityViewer2';
import TimelineItemCreateDialog from './TimelineItemCreateDialog';

import './Timeline.scss';

const DEFAULT_COLOR = Colors.BLUE2;

type Vertex = {
  color?: string;
  entityId: string;
};

type Layout = {
  vertices: Array<Vertex>;
};

type TimelineProps = {
  model: Model;
  entities: Array<Entity>;
  layout?: Layout;
  fetchEntitySuggestions?: (
    schema: Schema,
    query: string
  ) => Promise<Array<Entity>>;
};

type TimelineRendererProps = {
  entities: Array<Entity>;
  layout: Layout;
  selectedId?: string | null;
  onSelect: (entity: Entity) => void;
};

const Timeline: FC<TimelineProps> = ({
  model,
  entities,
  layout,
  fetchEntitySuggestions,
}) => {
  const [state, dispatch] = useReducer(reducer, {
    entities,
    layout: layout || { vertices: [] },
    selectedId: null,
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const toggleCreateDialog = () => setCreateDialogOpen(!createDialogOpen);

  const selectedEntity = selectSelectedEntity(state);
  const selectedVertex = selectSelectedVertex(state);
  const sortedEntities = selectSortedEntities(state);

  return (
    <div className={c('Timeline', selectedEntity && 'Timeline--selected')}>
      <div className="Timeline__main">
        <div className="Timeline__actions">
          <TimelineItemCreateDialog
            model={model}
            isOpen={createDialogOpen}
            onClose={toggleCreateDialog}
            onCreate={(entity) => {
              dispatch({ type: 'CREATE_ENTITY', payload: { entity } });
              toggleCreateDialog();
            }}
            fetchEntitySuggestions={fetchEntitySuggestions}
          />
          <Button
            intent={Intent.PRIMARY}
            icon="add"
            onClick={toggleCreateDialog}
          >
            Add item
          </Button>
        </div>
        <TimelineList
          entities={sortedEntities}
          layout={state.layout}
          onSelect={(entity: Entity) =>
            dispatch({ type: 'SELECT_ENTITY', payload: { entity } })
          }
          selectedId={selectedEntity && selectedEntity.id}
        />
      </div>
      {selectedEntity && selectedVertex && (
        <div className="Timeline__viewer">
          <EntityViewer2
            key={selectedEntity.id}
            entity={selectedEntity}
            vertex={selectedVertex}
            onVertexChange={(vertex: Vertex) =>
              dispatch({ type: 'UPDATE_VERTEX', payload: { vertex } })
            }
            onEntityChange={(entity: Entity) =>
              dispatch({ type: 'UPDATE_ENTITY', payload: { entity } })
            }
          />
        </div>
      )}
    </div>
  );
};

export default Timeline;
export { DEFAULT_COLOR };
export type { TimelineRendererProps, Vertex };
