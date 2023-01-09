import { FC, useReducer } from 'react';
import { Colors } from '@blueprintjs/colors';
import { Entity } from '@alephdata/followthemoney';
import c from 'classnames';
import {
  reducer,
  selectSortedEntities,
  selectSelectedEntity,
  selectSelectedVertex,
} from './state';
import TimelineList from './TimelineList';
import EntityViewer2 from './EntityViewer2';

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
  entities: Array<Entity>;
  layout: Layout;
};

type TimelineRendererProps = TimelineProps & {
  selectedId?: string | null;
  onSelect: (entity: Entity) => void;
};

const Timeline: FC<TimelineProps> = ({ entities, layout }) => {
  const [state, dispatch] = useReducer(reducer, {
    entities,
    layout,
    selectedId: null,
  });

  const selectedEntity = selectSelectedEntity(state);
  const selectedVertex = selectSelectedVertex(state);
  const sortedEntities = selectSortedEntities(state);

  return (
    <div className={c('Timeline', selectedEntity && 'Timeline--selected')}>
      <div className="Timeline__list">
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
