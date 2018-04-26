import React from 'react';
import {FormattedNumber, FormattedMessage} from 'react-intl';
import {Link} from 'react-router-dom';

import {Property, Schema} from 'src/components/common';
import queryString from "query-string";
import {EntityInfoTags} from 'src/components/Entity';
import getPath from "../../util/getPath";

class EntityConnections extends React.Component {
  constructor(props) {
    super(props);
    this.referenceLink = this.referenceLink.bind(this);
  }

  referenceLink(reference) {
    const {entity} = this.props;
    const path = getPath(entity.links.ui);
    const tabName = 'references-' + reference.property.qname;
    const query = queryString.stringify({'content:tab': tabName});
    return path + '#' + query;
  }

  render() {
    const {tags, references, entity} = this.props;

    return (
      <React.Fragment>
        {references.total !== undefined && references.total > 0 && (
          <div className='EntityConnections'>
            <span className="relationship">
              <FormattedMessage id='entity.connections.relationships' defaultMessage='Relationships'/>
            </span>
            <ul className="info-rank">
              {references.results.map((ref) => (
                <li key={ref.property.qname}>
                            <span className="key">
                              <Schema.Icon schema={ref.schema}/>{' '}
                              <Link to={this.referenceLink(ref)}>
                                <Property.Reverse model={ref.property}/>
                              </Link>
                            </span>
                  <span className="value">
                              <FormattedNumber value={ref.count}/>
                            </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <EntityInfoTags tags={tags} entity={entity}/>
      </React.Fragment>
    );
  }
}

export default EntityConnections;