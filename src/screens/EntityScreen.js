import React, { Component } from 'react';
import { connect } from 'react-redux';

import Article from 'components/Article';
import { fetchEntity } from 'actions';

class EntityInfo extends Component {
  render() {
    const { entity } = this.props;
    return (
      <Article.InfoPane>
        <h1>{entity.name}</h1>
        <ul>
          <li>{entity.schema}</li>
          <li>{entity.created_at}</li>
          <li>{entity.countries.join(', ')}</li>
        </ul>
      </Article.InfoPane>
    );
  }
}

class EntityContent extends Component {
  render() {
    const { entity } = this.props;
    return (
      <Article.ContentPane>
        <dl>
          {Object.entries(entity.properties).map(([property, values]) => ([
            <dt>{property}</dt>,
            <dd>
              {values.length === 1
                ? values[0]
                : (
                  <ul>
                    {values.map(value => (
                      <li>{value}</li>
                    ))}
                  </ul>
                )
              }
            </dd>
          ]))}
        </dl>
      </Article.ContentPane>
    );
  }
}

class EntityScreen extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { entityId, entity } = this.props;
    if (entity === undefined) {
      this.props.fetchEntity(entityId);
    }
  }

  render() {
    const { entity } = this.props;
    if (entity === undefined || entity._isFetching) {
      return (
        <span>Loading entity..</span>
      );
    }
    return (
      <Article>
        <EntityInfo entity={entity} />
        <EntityContent entity={entity} />
      </Article>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entityId } = ownProps.match.params;
  const entity = entityId !== undefined ? state.entityCache[entityId] : undefined;
  return { entityId, entity };
}

export default connect(mapStateToProps, { fetchEntity })(EntityScreen);
