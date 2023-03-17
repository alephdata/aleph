import { FC, useReducer, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, ButtonGroup, Intent } from '@blueprintjs/core';
import { Colors } from '@blueprintjs/colors';
import { Schema, Entity, Model } from '@alephdata/followthemoney';
import c from 'classnames';
import {
  TimelineRenderer,
  Layout,
  Vertex,
  TimelineChartZoomLevel,
} from './types';
import { TimelineItem, updateVertex } from './util';
import {
  reducer,
  selectSortedEntities,
  selectSelectedEntity,
  selectSelectedVertex,
} from './state';
import TimelineEmptyState from './TimelineEmptyState';
import { TimelineList } from './TimelineList';
import { TimelineChart } from './TimelineChart';
import EntityViewer2 from './EntityViewer2';
import TimelineItemCreateDialog from './TimelineItemCreateDialog';

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

  const [state, dispatch] = useReducer(reducer, {
    entities,
    layout: layout || { vertices: [] },
    selectedId: null,
    zoomLevel: 'months',
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const toggleCreateDialog = () => setCreateDialogOpen(!createDialogOpen);

  const selectedEntity = selectSelectedEntity(state);
  const selectedVertex = selectSelectedVertex(state);
  const sortedEntities = selectSortedEntities(state);

  const items = sortedEntities.map(
    (entity) => new TimelineItem(entity, state.layout)
  );

  const createButton = (
    <Button intent={Intent.PRIMARY} icon="add" onClick={toggleCreateDialog}>
      <FormattedMessage id="timeline.add_item" defaultMessage="Add item" />
    </Button>
  );

  const zoomLevelSwitch = (
    <ButtonGroup>
      <Button
        active={state.zoomLevel === 'days'}
        onClick={() =>
          dispatch({ type: 'SET_ZOOM_LEVEL', payload: { zoomLevel: 'days' } })
        }
      >
        <FormattedMessage id="timeline.zoom_level.days" defaultMessage="Days" />
      </Button>
      <Button
        active={state.zoomLevel === 'months'}
        onClick={() =>
          dispatch({ type: 'SET_ZOOM_LEVEL', payload: { zoomLevel: 'months' } })
        }
      >
        <FormattedMessage
          id="timeline.zoom_level.months"
          defaultMessage="Months"
        />
      </Button>
      <Button
        active={state.zoomLevel === 'years'}
        onClick={() =>
          dispatch({ type: 'SET_ZOOM_LEVEL', payload: { zoomLevel: 'years' } })
        }
      >
        <FormattedMessage
          id="timeline.zoom_level.years"
          defaultMessage="Years"
        />
      </Button>
    </ButtonGroup>
  );

  return (
    <div className={c('Timeline', selectedEntity && 'Timeline--selected')}>
      <TimelineItemCreateDialog
        model={model}
        isOpen={createDialogOpen}
        onClose={toggleCreateDialog}
        onCreate={async (entity) => {
          const storedEntity = await onEntityCreateOrUpdate(entity);
          dispatch({
            type: 'CREATE_ENTITY',
            payload: { entity: storedEntity },
          });
          toggleCreateDialog();
        }}
        fetchEntitySuggestions={fetchEntitySuggestions}
      />

      <div className="Timeline__main">
        {items.length <= 0 && (
          <TimelineEmptyState action={writeable ? createButton : undefined} />
        )}

        {items.length > 0 && (
          <>
            {writeable && (
              <div className="Timeline__actions">
                {createButton}
                {renderer === 'chart' && zoomLevelSwitch}
              </div>
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
