import React, {Component} from 'react';
import {connect} from 'react-redux';
import {injectIntl, FormattedMessage, defineMessages} from 'react-intl';
import {debounce} from 'lodash';
import Waypoint from 'react-waypoint';
import { NonIdealState, Button } from '@blueprintjs/core';
import pallete from 'google-palette';

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
    this.fetchPermissions = this.fetchPermissions.bind(this);
  }

  componentDidMount() {
    this.fetchData();

  }

  componentWillReceiveProps(nextProps) {
    if(this.props !== nextProps) {
      //this.fetchData();
    }
  }

  componentDidUpdate() {
    this.fetchPermissions();
  }

  fetchData() {
    let {query} = this.props;
    this.props.queryCollections({query});
  }

  fetchPermissions() {
    const { result } = this.props;
    if (result.total !== 0) {
      /*result.results.map((collection) => {
        console.log(collection)
        return this.props.fetchCollectionPermissions(collection.id);
      });*/
    }
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
    const {result, query, intl} = this.props;
    const { dialogIsOpen } = this.state;
    const hasCases = result.total !== 0;

    let scheme = pallete.listSchemes('mpn65')[0];
    let colors = scheme.apply(scheme, [result.total] );

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
            <CaseExplanationBox hasCases={hasCases} toggleCreateCase={this.toggleCreateCase}/>
            {result.total !== 0 && <CaseIndexTable query={query}
                                                   colors={colors}
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
