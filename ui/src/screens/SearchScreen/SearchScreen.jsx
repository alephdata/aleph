import React from 'react';
import queryString from 'query-string';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { AnchorButton, Icon, ButtonGroup, Tooltip } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Query from 'app/Query';
import { selectEntitiesResult } from 'selectors';
import { triggerQueryExport } from 'src/actions';
import {
  Collection, DualPane, SignInCallout, ErrorSection, Breadcrumbs, ResultText,
} from 'components/common';
import { DialogToggleButton } from 'components/Toolbar';
import FacetedEntitySearch from 'components/EntitySearch/FacetedEntitySearch';
import ExportDialog from 'dialogs/ExportDialog/ExportDialog';
import Screen from 'components/Screen/Screen';
import togglePreview from 'util/togglePreview';

import './SearchScreen.scss';

const messages = defineMessages({
  no_results_title: {
    id: 'search.no_results_title',
    defaultMessage: 'No search results',
  },
  no_results_description: {
    id: 'search.no_results_description',
    defaultMessage: 'Try making your search more general',
  },
  title: {
    id: 'search.title',
    defaultMessage: 'Search: {title}',
  },
  loading: {
    id: 'search.loading',
    defaultMessage: 'Loading...',
  },
  export: {
    id: 'search.screen.export',
    defaultMessage: 'Export',
  },
  alert_export_disabled: {
    id: 'search.screen.export_disabled',
    defaultMessage: 'Cannot export more than 10,000 results at a time',
  },
  alert_export_disabled_empty: {
    id: 'search.screen.export_disabled_empty',
    defaultMessage: 'No results to export.',
  },
});

const facetKeys = [
  'collection_id', 'schema', 'countries', 'languages', 'emails', 'phones', 'names', 'addresses', 'mimetypes',
];

export class SearchScreen extends React.Component {
  constructor(props) {
    super(props);

    this.updateQuery = this.updateQuery.bind(this);
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    // make it so the preview disappears if the query is changed.
    const parsedHash = queryString.parse(location.hash);
    parsedHash['preview:id'] = undefined;
    parsedHash['preview:type'] = undefined;

    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const { query, result, intl } = this.props;
    const titleStatus = result.query_text ? result.query_text : intl.formatMessage(messages.loading);
    const title = intl.formatMessage(messages.title, { title: titleStatus });
    const exportLink = result?.total > 0 ? result?.links?.export : null;
    const tooltip = intl.formatMessage(result?.total > 0 ? messages.alert_export_disabled : messages.alert_export_disabled_empty);
    const noResults = !result.isPending && result.total === 0;

    const operation = (
      <ButtonGroup>
        <Tooltip content={tooltip} disabled={exportLink}>
          <DialogToggleButton
            buttonProps={{
              text: intl.formatMessage(messages.export),
              icon: "export",
              disabled: !exportLink,
              className: "bp3-intent-primary"
            }}
            Dialog={ExportDialog}
            dialogProps={{
              onExport: () => this.props.triggerQueryExport(exportLink)
            }}
          />
        </Tooltip>
      </ButtonGroup>
    );
    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Text icon="search">
          <FormattedMessage id="search.screen.breadcrumb" defaultMessage="Search" />
        </Breadcrumbs.Text>
        <Breadcrumbs.Text active>
          <ResultText result={result} />
        </Breadcrumbs.Text>
      </Breadcrumbs>
    );

    return (
      <Screen
        query={query}
        title={title}
      >
        {breadcrumbs}
        <SignInCallout />
        <FacetedEntitySearch
          facets={facetKeys}
          query={query}
          result={result}
        />
      </Screen>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  // We normally only want Things, not Intervals (relations between things).
  const context = {
    highlight: true,
    'filter:schemata': 'Thing',
  };

  const query = Query.fromLocation('entities', location, context, '');
  const result = selectEntitiesResult(state, query);

  return { query, result };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { triggerQueryExport }),
  injectIntl,
)(SearchScreen);
