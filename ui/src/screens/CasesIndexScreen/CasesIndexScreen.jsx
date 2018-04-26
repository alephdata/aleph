import React, {Component} from 'react';
import {connect} from 'react-redux';
import {injectIntl, FormattedMessage, defineMessages} from 'react-intl';
import {debounce} from 'lodash';
import Waypoint from 'react-waypoint';
import { NonIdealState, Button } from '@blueprintjs/core';

import {queryCollections} from 'src/actions';
import {selectCollectionsResult} from 'src/selectors';
import { Screen, Breadcrumbs, DualPane, SectionLoading } from 'src/components/common';
import CaseIndexTable from "../../components/CaseIndexTable/CaseIndexTable";
import Query from "../../app/Query";
import CaseExplanationBox from "../../components/Case/CaseExplanationBox";
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
  }
});

class CasesIndexScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dialogIsOpen: false
      //queryPrefix: props.query.getString('prefix')
    };

    this.updateQuery = debounce(this.updateQuery.bind(this), 200);
    this.toggleCreateCase = this.toggleCreateCase.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchData();
    }
  }

  fetchData() {
    let {query} = this.props;
    this.props.queryCollections({query});
  }

  updateQuery(newQuery) {
    const {history, location} = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation()
    });
  }

  toggleCreateCase() {
    this.setState({ dialogIsOpen: !this.state.dialogIsOpen });
  }

  render() {
    const {result, query, intl, collection} = this.props;
    const { dialogIsOpen } = this.state;
    console.log(result)

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
        <DualPane>
          <DualPane.ContentPane>
            <CreateCaseDialog
              isOpen={dialogIsOpen}
              toggleDialog={this.toggleCreateCase}
            />
            <CaseExplanationBox/>
            {result.total !== 0 && <CaseIndexTable query={query}
                         updateQuery={this.updateQuery}
                         result={result}/>}
            {result.total === 0 && (
              <div className='error-and-add-button'>
                <NonIdealState visual="search"
                               title={intl.formatMessage(messages.no_results_title)}
                               description={intl.formatMessage(messages.no_results_description)} />
                <Button onClick={this.toggleCreateCase} icon="plus" className="add-case-button pt-intent-primary">
                  <FormattedMessage id="case.add" defaultMessage="Add new case"/>
                </Button>
              </div>
            )}
            {/*{!result.isLoading && result.next && (
              <Waypoint
                onEnter={this.getMoreResults}
                bottomOffset="-600px"
                scrollableAncestor={window}
              />
            )}*/}
            {result.total === undefined && (
              <SectionLoading/>
            )}
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const context = {
    facet: ['category', 'countries'],
    'filter:kind': 'casefile' };
  const query = Query.fromLocation('collections', ownProps.location, context, 'collections')
    .sortBy('count', true)
    .limit(30);
  return {
    query: query,
    result: selectCollectionsResult(state, query)
  };
};

CasesIndexScreen = injectIntl(CasesIndexScreen);
CasesIndexScreen = connect(mapStateToProps, {queryCollections})(CasesIndexScreen);
export default CasesIndexScreen;
