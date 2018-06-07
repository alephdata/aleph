import React, {Component} from 'react';
import Waypoint from 'react-waypoint';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage, defineMessages } from 'react-intl';
import { debounce } from 'lodash';
import { NonIdealState, Button, Icon } from '@blueprintjs/core';

import Query from "src/app/Query";
import { queryCollections, updateCollectionPermissions, createCollection } from 'src/actions';
import { selectCollectionsResult } from 'src/selectors';
import { Screen, Breadcrumbs, ErrorScreen, SinglePane, SectionLoading } from 'src/components/common';
import { CaseExplanationBox, CaseIndexTable } from "src/components/Case";
import CreateCaseDialog from 'src/dialogs/CreateCaseDialog/CreateCaseDialog';

import './CasesIndexScreen.css';

const messages = defineMessages({
  no_results_title: {
    id: 'cases.no_results_title',
    defaultMessage: 'No cases',
  },
  no_results_description: {
    id: 'cases.no_results_description',
    defaultMessage: 'Try adding new case.',
  },
  filter: {
    id: 'case.search_cases_placeholder',
    defaultMessage: 'Search cases'
  },
  not_found: {
    id: 'case.not.found',
    defaultMessage: 'Log in to create your own case files, upload documents and manage your investigations!'
  }
});


class CasesIndexScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      createIsOpen: false,
      queryPrefix: props.query.getString('prefix')
    };
    this.toggleCreateCase = this.toggleCreateCase.bind(this);
    this.onChangeQueryPrefix = this.onChangeQueryPrefix.bind(this);
    this.updateQuery = debounce(this.updateQuery.bind(this), 200);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    let { query, result } = this.props;
    if (result.total === undefined && !result.isLoading && !result.isError) {
      this.props.queryCollections({ query });
    }
  }

  toggleCreateCase() {
    this.setState({createIsOpen: !this.state.createIsOpen});
  }

  onChangeQueryPrefix({target}) {
    this.setState({queryPrefix: target.value});
    const query = this.props.query.set('prefix', target.value);
    this.updateQuery(query);
  }

  updateQuery(newQuery) {
    const {history, location} = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation()
    });
  }

  getMoreResults() {
    const {query, result, queryCollections} = this.props;
    if (!result.isLoading && result.next) {
      queryCollections({query, next: result.next});
    }
  }

  render() {
    const { query, result, intl, session } = this.props;
    const { queryPrefix } = this.state;
    const hasCases = result.total !== 0;

    if (session && !session.loggedIn) {
      return <ErrorScreen title={intl.formatMessage(messages.not_found)}/>
    }

    const breadcrumbs = (<Breadcrumbs>
      <li>
        <a className="pt-breadcrumb">
          <FormattedMessage id="cases.browser.breadcrumb"
                            defaultMessage="Cases overview"/>
        </a>
      </li>
    </Breadcrumbs>);

    return (
      <Screen className="CasesIndexScreen" breadcrumbs={breadcrumbs}>
        <SinglePane>
          <CreateCaseDialog isOpen={this.state.createIsOpen}
                            toggleDialog={this.toggleCreateCase} />
          <div className='explanation'>
            <div className='explanation-inner'>
              <Icon icon="briefcase" iconSize={100} color='white'/>
              <div className='explanation-padding'>
                <h1 className='title-explanation'>
                  <FormattedMessage id="case.question" defaultMessage="What are cases?"/>
                </h1>
                <p className='description-explanation'>
                  <FormattedMessage id="case.description"
                                    defaultMessage="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."/>
                </p>
                {hasCases && <Button onClick={this.toggleCreateCase} icon="plus" className="add-case-button">
                  <FormattedMessage id="case.add" defaultMessage="Add new case"/>
                </Button>}
              </div>
            </div>
          </div>
          <div className="pt-input-group filter-cases">
            <i className="pt-icon pt-icon-search"/>
            <input className="pt-input" type="search"
                   placeholder={intl.formatMessage(messages.filter)}
                   onChange={this.onChangeQueryPrefix} value={queryPrefix}/>
          </div>
          {result.total !== 0 && (
            <CaseIndexTable query={query}
                            result={result} />
          )}
          {result.total === 0 && (
            <div className='error-and-add-button'>
              <NonIdealState visual="search"
                             title={intl.formatMessage(messages.no_results_title)}
                             description={intl.formatMessage(messages.no_results_description)}/>
              <Button onClick={this.toggleCreateCase} icon="plus" className="add-case-button pt-intent-primary">
                <FormattedMessage id="case.add" defaultMessage="Add new case"/>
              </Button>
            </div>
          )}
          {!result.isLoading && result.next && (
              <Waypoint onEnter={this.getMoreResults}
                        bottomOffset="-600px"
                        scrollableAncestor={window} />
          )}
          {result.isLoading && (
            <SectionLoading/>
          )}
        </SinglePane>
      </Screen>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const {location} = ownProps;
  const context = {
    facet: [ 'category', 'countries' ],
    'filter:kind': 'casefile'
  };
  const query = Query.fromLocation('collections', location, context, 'collections')
    .sortBy('count', true)
    .limit(30);

  return {
    query: query,
    result: selectCollectionsResult(state, query),
    session: state.session
  };
};

CasesIndexScreen = injectIntl(CasesIndexScreen);
CasesIndexScreen = connect(mapStateToProps, {
  queryCollections,
  updateCollectionPermissions,
  createCollection
})(CasesIndexScreen);
export default CasesIndexScreen;
