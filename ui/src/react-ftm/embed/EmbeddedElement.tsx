import React from 'react';

import NetworkDiagramWrapper from 'react-ftm/embed/NetworkDiagramWrapper';
import EntityTableWrapper from 'react-ftm/embed/EntityTableWrapper';
import HistogramWrapper from 'react-ftm/embed/HistogramWrapper';

import { EntityManager } from 'react-ftm/components/common';

export interface IEmbeddedElementProps {
  id: string;
  data: any;
  type: string;
  config?: any;
}

export class EmbeddedElement extends React.Component<IEmbeddedElementProps> {
  private entityManager: EntityManager;

  constructor(props: IEmbeddedElementProps) {
    super(props);
    if (props.data) {
      this.entityManager = EntityManager.fromJSON(
        {},
        props.data?.entities || props.data?.layout?.entities
      );
    } else {
      this.entityManager = new EntityManager();
    }

    this.onUpdate = this.onUpdate.bind(this);
  }

  onUpdate(additionalData?: any) {
    const { id, config } = this.props;
    if (config?.writeable) {
      const updatedData = JSON.stringify({
        entities: this.entityManager.toJSON(),
        ...additionalData,
      });
      localStorage.setItem(id, updatedData);
    }
  }

  render() {
    const { config, data, type } = this.props;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { entities, ...rest } = data;

    let Element;
    switch (type) {
      case 'EntityTable':
        Element = EntityTableWrapper;
        break;
      case 'Histogram':
        return <HistogramWrapper />;
        break;
      default:
        Element = NetworkDiagramWrapper;
        break;
    }

    return (
      <Element
        entityManager={this.entityManager}
        onUpdate={this.onUpdate}
        writeable={config?.writeable}
        layoutData={rest}
      />
    );
  }
}
