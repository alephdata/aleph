import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import queryString from 'query-string';

import withRouter from '/src/app/withRouter.jsx';
import { fetchEntitySet, queryEntitySetEntities } from '/src/actions/index.js';
import {
  selectEntitySet,
  selectEntitiesResult,
  selectModel,
} from '/src/selectors.js';
import {
  entitySetSchemaCountsQuery,
  entitySetEntitiesQuery,
} from '/src/queries.js';
import Screen from '/src/components/Screen/Screen';
import EntityTable from '/src/components/EntityTable/EntityTable';
import EntitySetManageMenu from '/src/components/EntitySet/EntitySetManageMenu';
import CollectionWrapper from '/src/components/Collection/CollectionWrapper';
import LoadingScreen from '/src/components/Screen/LoadingScreen';
import ErrorScreen from '/src/components/Screen/ErrorScreen';
import collectionViewIds from '/src/components/Collection/collectionViewIds';
import CollectionView from '/src/components/Collection/CollectionView';
import {
  Breadcrumbs,
  DualPane,
  SchemaCounts,
} from '/src/components/common/index.jsx';

import './ListScreen.scss';

export class ListScreen extends Component {
  constructor(props) {
    super(props);
    this.getLink = this.getLink.bind(this);
    this.onSchemaSelect = this.onSchemaSelect.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { list, countsResult, countsQuery, entitySetId } = this.props;

    if (list.shouldLoad) {
      this.props.fetchEntitySet({ id: entitySetId });
    }
    if (countsResult.shouldLoad) {
      this.props.queryEntitySetEntities({ query: countsQuery });
    }
  }

  getLink(schema) {
    const { location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash.type = schema;

    return `${location.pathname}/#${queryString.stringify(parsedHash)}`;
  }

  onSchemaSelect(schema) {
    const { navigate } = this.props;
    navigate(this.getLink(schema));
  }

  processCounts = () => {
    const { countsResult } = this.props;
    if (!countsResult?.facets?.schema?.values) {
      return {};
    }

    const counts = {};
    countsResult.facets.schema.values.forEach(({ id, count }) => {
      counts[id] = count;
    });
    return counts;
  };

  render() {
    const { activeSchema, list, querySchemaEntities } = this.props;

    if (list.isError) {
      return <ErrorScreen error={list.error} />;
    }

    if (list.id === undefined) {
      return <LoadingScreen />;
    }

    const operation = <EntitySetManageMenu entitySet={list} />;

    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Text>
          <CollectionView.Link
            id={collectionViewIds.LISTS}
            collection={list.collection}
            icon
          />
        </Breadcrumbs.Text>
        <Breadcrumbs.EntitySet key="list" entitySet={list} icon={false} />
      </Breadcrumbs>
    );

    return (
      <Screen title={list.label} description={list.summary || ''}>
        <CollectionWrapper collection={list.collection}>
          {breadcrumbs}
          <DualPane className="ListScreen">
            <div className="ListScreen__schema-counts">
              <SchemaCounts
                schemaCounts={this.processCounts()}
                link={this.getLink}
                onSelect={this.onSchemaSelect}
                showSchemaAdd={list.writeable}
                activeSchema={activeSchema.name}
              />
            </div>
            <DualPane.ContentPane>
              <EntityTable
                query={querySchemaEntities(activeSchema)}
                collection={list.collection}
                schema={activeSchema}
                writeable={list.writeable}
                isEntitySet
              />
            </DualPane.ContentPane>
          </DualPane>
        </CollectionWrapper>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, params } = ownProps;
  const { entitySetId } = params;

  const model = selectModel(state);
  const list = selectEntitySet(state, entitySetId);
  const countsQuery = entitySetSchemaCountsQuery(entitySetId);
  const countsResult = selectEntitiesResult(state, countsQuery);
  const querySchemaEntities = (schema) =>
    entitySetEntitiesQuery(location, entitySetId, schema.name, 30);
  const hashQuery = queryString.parse(location.hash);

  return {
    entitySetId,
    list,
    countsQuery,
    countsResult,
    querySchemaEntities,
    activeSchema: model.getSchema(hashQuery.type || 'Person'),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { fetchEntitySet, queryEntitySetEntities })
)(ListScreen);
