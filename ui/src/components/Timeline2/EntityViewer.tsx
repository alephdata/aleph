import { FC } from 'react';
import { Entity } from '@alephdata/followthemoney';
import { Schema } from 'src/react-ftm/types';
import { DEFAULT_COLOR, Vertex } from './Timeline';
import EntityViewerProperties from './EntityViewerProperties';
import { ColorPicker } from 'src/react-ftm';

import './EntityViewer.scss';

type Props = {
  entity: Entity;
  vertex?: Vertex;
};

const EntityViewer: FC<Props> = ({ entity, vertex }) => {
  const currentColor = vertex?.color || DEFAULT_COLOR;

  return (
    <article className="EntityViewer">
      <header className="EntityViewer__header">
        <div className="EntityViewer__schema">
          <Schema.Label schema={entity.schema} icon />
        </div>
        <h2 className="EntityViewer__caption">{entity.getCaption()}</h2>
      </header>
      <div className="EntityViewer__color">
        <ColorPicker currSelected={currentColor} onSelect={() => {}} />
      </div>
      <EntityViewerProperties entity={entity} />
    </article>
  );
};

export default EntityViewer;
