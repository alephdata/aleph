import React, { PureComponent } from 'react';
import { Entity, Property } from 'components/common';

import './EntityCompare.scss';
import Skeleton from 'components/common/Skeleton';

class EntityCompare extends PureComponent {
  getCommonProperties(entity, other, showEmpty) {
    const properties = [...entity.schema.getFeaturedProperties()];

    other.schema.getFeaturedProperties().forEach((prop) => {
      if (properties.indexOf(prop) === -1) {
        properties.push(prop);
      }
    });

    return properties.filter((prop) => {
      return entity.hasProperty(prop) || (showEmpty && other.hasProperty(prop));
    });
  }

  renderSkeleton() {
    return (
      <>
        <Skeleton.Text type="span" length={30} />
        <div className="EntityCompare__properties">
          {[1, 2, 3].map((prop) => (
            <div className="EntityCompare__property" key={prop}>
              <span className="EntityCompare__property__name text-muted">
                <Skeleton.Text type="span" length={10} />
              </span>
              <span className="EntityCompare__property__value">
                <Skeleton.Text type="span" length={20} />
              </span>
            </div>
          ))}
        </div>
      </>
    );
  }

  render() {
    const { entity, other, showEmpty = false, isPending = false } = this.props;
    if (isPending || entity?.isPending || other?.isPending) {
      return this.renderSkeleton();
    }

    const properties = this.getCommonProperties(entity, other, showEmpty);
    return (
      <>
        <Entity.Link entity={entity} profile={false} preview icon />
        <div className="EntityCompare__properties">
          {properties.map((prop) => (
            <div className="EntityCompare__property" key={prop.qname}>
              <span className="EntityCompare__property__name text-muted">
                <Property.Name prop={prop} />
              </span>
              <span className="EntityCompare__property__value">
                <Property.Values
                  prop={prop}
                  values={entity.getProperty(prop)}
                  translitLookup={entity.latinized}
                />
              </span>
            </div>
          ))}
        </div>
      </>
    );
  }
}

export default EntityCompare;
