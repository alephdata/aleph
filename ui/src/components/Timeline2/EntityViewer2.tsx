import { FC } from 'react';
import { Entity } from '@alephdata/followthemoney';
import { Schema } from 'src/react-ftm/types';
import { DEFAULT_COLOR, Vertex } from './Timeline';
import EntityViewerProperties from './EntityViewerProperties';
import { ColorPicker } from 'src/react-ftm';

import './EntityViewer2.scss';

type Props = {
  entity: Entity;
  vertex: Vertex;
  onVertexChange?: (vertex: Vertex) => void;
  onEntityChange?: (entity: Entity) => void;
};

const EntityViewer2: FC<Props> = ({
  entity,
  vertex,
  onVertexChange,
  onEntityChange,
}) => {
  const currentColor = vertex?.color || DEFAULT_COLOR;

  return (
    <article className="EntityViewer2">
      <header className="EntityViewer2__header">
        <div className="EntityViewer2__schema">
          <Schema.Label schema={entity.schema} icon />
        </div>
        <h2 className="EntityViewer2__caption">{entity.getCaption()}</h2>
      </header>
      <div className="EntityViewer2__color">
        <ColorPicker
          currSelected={currentColor}
          onSelect={(color) =>
            onVertexChange && onVertexChange({ ...vertex, color })
          }
        />
      </div>
      <EntityViewerProperties
        entity={entity}
        onChange={(entity) => onEntityChange && onEntityChange(entity)}
      />
    </article>
  );
};

export default EntityViewer2;
