import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';

import Property from './Property';
import Entity from './Entity';
import DualPane from 'src/components/common/DualPane';
import Date from 'src/components/common/Date';
import Schema from 'src/components/common/Schema';
import EntityReferences from './EntityReferences';
import { fetchEntityReferences } from '../../actions/index';

import './EntityContent.css';

class EntityContent extends Component {
  componentDidMount() {
    const { entity } = this.props;
    if(!this.props.references && entity && entity.id) {
      this.props.fetchEntityReferences(entity);
    }
  }

  render() {
    const { entity, schema } = this.props;

    const properties = _.values(schema.properties).filter((prop) => {
      if (prop.caption) {
        return false;
      }
      return prop.featured || !!entity.properties[prop.name];
    });

    return (
      <DualPane.ContentPane>
        <div className="EntityContent">
      
          <span className="muted">
            <Schema.Icon schema={entity.schema}/>{' '}<Schema.Name schema={entity.schema}/>
          </span>

          <h1>
            <Entity.Label entity={entity} addClass={true}/>
          </h1>
        
          <ul className="info-sheet">
            <li>
            </li>
            { properties.map((prop) => (
              <li key={prop.name}>
                <span className="key">
                  <Property.Name model={prop} />
                </span>
                <span className="value">
                  <Property.Values model={prop} values={entity.properties[prop.name]} />
                </span>
              </li>
            ))}
            <li>
              <span className="key">
                <FormattedMessage id="entity.updated" defaultMessage="Last updated"/>
              </span>
              <span className="value">
                <Date value={entity.updated_at} />
              </span>
            </li>
          </ul>
          
          <EntityReferences entity={entity} />
        </div>
      </DualPane.ContentPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    references: state.entityReferences[ownProps.entity.id],
    schema: state.metadata.schemata[ownProps.entity.schema]
  };
};

export default connect(mapStateToProps, {fetchEntityReferences})(EntityContent);