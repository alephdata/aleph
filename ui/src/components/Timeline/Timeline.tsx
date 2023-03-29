import { FC } from 'react';
import { Colors } from '@blueprintjs/colors';
import { Schema, Entity, Model } from '@alephdata/followthemoney';
import c from 'classnames';
import { Layout, Vertex } from './types';
import { TimelineItem, updateVertex } from './util';
import {
  selectSelectedEntity,
  selectSelectedVertex,
  selectItems,
  selectIsEmpty,
  selectZoomLevel,
} from './state';
import { useTimelineContext } from './context';
import TimelineEmptyState from './TimelineEmptyState';
import { TimelineList } from './TimelineList';
import { TimelineChart } from './TimelineChart';
import EntityViewer2 from './EntityViewer2';
import TimelineItemCreateDialog from './TimelineItemCreateDialog';
import TimelineItemCreateButton from './TimelineItemCreateButton';

import './Timeline.scss';

const DEFAULT_COLOR = Colors.BLUE2;

type TimelineProps = {
  model: Model;
  writeable?: boolean;
  fetchEntitySuggestions: (
    schema: Schema,
    query: string
  ) => Promise<Array<Entity>>;
  onEntityCreateOrUpdate: (entity: Entity) => Promise<Entity>;
  onEntityRemove: (entity: Entity) => Promise<unknown>;
  onLayoutUpdate: (layout: Layout) => Promise<unknown>;
};

const Timeline: FC<TimelineProps> = ({
  model,
  writeable,
  fetchEntitySuggestions,
  onEntityCreateOrUpdate,
  onEntityRemove,
  onLayoutUpdate,
}) => {
  const [state, dispatch] = useTimelineContext();
  const Renderer = state.renderer === 'chart' ? TimelineChart : TimelineList;

  const selectedEntity = selectSelectedEntity(state);
  const selectedVertex = selectSelectedVertex(state);
  const items = selectItems(state);
  const isEmpty = selectIsEmpty(state);
  const zoomLevel = selectZoomLevel(state);

  return (
    <div className={c('Timeline', selectedEntity && 'Timeline--selected')}>
      <TimelineItemCreateDialog
        model={model}
        isOpen={state.showCreateDialog}
        onClose={() => dispatch({ type: 'TOGGLE_CREATE_DIALOG' })}
        onCreate={async (entity) => {
          const storedEntity = await onEntityCreateOrUpdate(entity);
          dispatch({ type: 'TOGGLE_CREATE_DIALOG' });
          dispatch({
            type: 'CREATE_ENTITY',
            payload: { entity: storedEntity },
          });
        }}
        fetchEntitySuggestions={fetchEntitySuggestions}
      />

      <div className="Timeline__main">
        {isEmpty && (
          <TimelineEmptyState
            action={
              writeable ? (
                <TimelineItemCreateButton
                  onClick={() => dispatch({ type: 'TOGGLE_CREATE_DIALOG' })}
                />
              ) : undefined
            }
          />
        )}

        {!isEmpty && (
          <Renderer
            items={items}
            selectedId={selectedEntity && selectedEntity.id}
            writeable={writeable}
            zoomLevel={zoomLevel}
            onSelect={(entity: Entity) =>
              dispatch({ type: 'SELECT_ENTITY', payload: { entity } })
            }
            onUnselect={() => dispatch({ type: 'UNSELECT_ENTITY' })}
            onRemove={(entity: Entity) => {
              dispatch({ type: 'REMOVE_ENTITY', payload: { entity } });
              onEntityRemove(entity);
            }}
          />
        )}
      </div>

      {selectedEntity && selectedVertex && (
        <div className="Timeline__viewer">
          <EntityViewer2
            key={selectedEntity.id}
            entity={selectedEntity}
            vertex={selectedVertex}
            fetchEntitySuggestions={fetchEntitySuggestions}
            writeable={writeable}
            onVertexChange={(vertex: Vertex) => {
              dispatch({ type: 'UPDATE_VERTEX', payload: { vertex } });
              // State updates are executed asyncronously, so we need to compute the new layout explicitly
              const newLayout = updateVertex(state.layout, vertex);
              onLayoutUpdate(newLayout);
            }}
            onEntityChange={(entity: Entity) => {
              dispatch({ type: 'UPDATE_ENTITY', payload: { entity } });
              onEntityCreateOrUpdate(entity);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Timeline;
export { DEFAULT_COLOR };
