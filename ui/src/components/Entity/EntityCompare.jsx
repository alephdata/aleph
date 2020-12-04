import React, { PureComponent } from 'react';
import { Entity, Property } from 'components/common';

import './EntityCompare.scss';

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

    render() {
        const { entity, other, showEmpty = false } = this.props;
        const properties = this.getCommonProperties(entity, other, showEmpty);

        return (
            <>
                <Entity.Link entity={entity} preview icon />
                <div className="EntityCompare__properties">
                    {properties.map((prop) => (
                        <div className="EntityCompare__property" key={prop.name}>
                            <span className="EntityCompare__property__name text-muted">
                                <Property.Name prop={prop} />
                            </span>
                            <span className="EntityCompare__property__value">
                                <Property.Values prop={prop} values={entity.getProperty(prop)} translitLookup={entity.latinized} />
                            </span>
                        </div>
                    ))}
                </div>
            </>
        );
    }
};

export default EntityCompare;
