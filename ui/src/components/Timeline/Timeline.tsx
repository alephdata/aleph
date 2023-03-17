import { FC } from 'react';
import { Colors } from '@blueprintjs/colors';
import { Schema, Entity, Model } from '@alephdata/followthemoney';
import c from 'classnames';
import { TimelineRenderer, Layout, Vertex } from './types';
import { TimelineItem, updateVertex } from './util';
import {
  useTimelineState,
  selectSortedEntities,
  selectSelectedEntity,
  selectSelectedVertex,
} from './state';
import TimelineEmptyState from './TimelineEmptyState';
import { TimelineList } from './TimelineList';
import { TimelineChart } from './TimelineChart';
import EntityViewer2 from './EntityViewer2';
import TimelineItemCreateDialog from './TimelineItemCreateDialog';
import TimelineItemCreateButton from './TimelineItemCreateButton';
import TimelineActions from './TimelineActions';

import './Timeline.scss';

const DEFAULT_COLOR = Colors.BLUE2;

type TimelineProps = {
  model: Model;
  entities: Array<Entity>;
  layout?: Layout;
  renderer?: TimelineRenderer;
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
  entities,
  layout,
  renderer,
  writeable,
  fetchEntitySuggestions,
  onEntityCreateOrUpdate,
  onEntityRemove,
  onLayoutUpdate,
}) => {
  const Renderer = renderer === 'chart' ? TimelineChart : TimelineList;
  const [state, dispatch] = useTimelineState(entities, layout);

  const selectedEntity = selectSelectedEntity(state);
  const selectedVertex = selectSelectedVertex(state);
  const sortedEntities = selectSortedEntities(state);

  const items = sortedEntities.map(
    (entity) => new TimelineItem(entity, state.layout)
  );

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
        {items.length <= 0 && (
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

        {items.length > 0 && (
          <>
            {writeable && (
              <TimelineActions
                zoomLevel={state.zoomLevel}
                onCreateDialogToggle={() =>
                  dispatch({ type: 'TOGGLE_CREATE_DIALOG' })
                }
                onZoomLevelChange={(zoomLevel) =>
                  dispatch({
                    type: 'SET_ZOOM_LEVEL',
                    payload: { zoomLevel },
                  })
                }
              />
            )}
            <Renderer
              items={items}
              selectedId={selectedEntity && selectedEntity.id}
              writeable={writeable}
              zoomLevel={state.zoomLevel}
              onSelect={(entity: Entity) =>
                dispatch({ type: 'SELECT_ENTITY', payload: { entity } })
              }
              onUnselect={() => dispatch({ type: 'UNSELECT_ENTITY' })}
              onRemove={(entity: Entity) => {
                dispatch({ type: 'REMOVE_ENTITY', payload: { entity } });
                onEntityRemove(entity);
              }}
            />
          </>
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
