import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router';

import {MenuItem} from "@blueprintjs/core/lib/esm/components/menu/menuItem";
import {Suggest} from "src/components/common/Suggest";
import SearchAlert from 'src/components/SearchAlert/SearchAlert'
import {selectQueryLogsLimited, selectSession} from 'src/selectors';
import {fetchQueryLogs} from 'src/actions/queryLogsActions';
import Query from "../../app/Query";


const ICON_VIRTUAL_SUGGEST = 'edit';
const ICON_EXISTING_SUGGEST = undefined;


class SearchBox extends PureComponent {
  state = {
    searchValue: '',
  };

  componentWillMount(){
    const  {queryLogs, session, fetchQueryLogs, query} = this.props;
    if(session.loggedIn && !queryLogs.isLoading && queryLogs.shouldLoad){
      fetchQueryLogs({query, next: queryLogs.next})
    }
  }

  onChange = (newSearchValue) => this.props.updateSearchValue(newSearchValue);

  onItemSelect = ({text}) => {
    this.props.updateSearchValue(text);
    this.props.doSearch(text);
  };

  itemRenderer =  (queryItem, { handleClick, modifiers }) => {
    const icon = queryItem.isVirtual ? ICON_VIRTUAL_SUGGEST : ICON_EXISTING_SUGGEST;
    const props = {
      active: modifiers.active,
      className: 'navbar-search-item',
      key: queryItem.text,
      onClick: handleClick,
      text: queryItem.text,
      icon
    };
    return ( <MenuItem
      {...props}
      />);
  };

  queryLogItems(text, queryList) {
    return text ? [{text: text, isVirtual: true}] : queryList
  }

  render() {
    const {
      props: { placeholder, searchValue },
      itemRenderer, onChange,
      queryLogItems,
      onItemSelect
    } = this;
    const inputProps = {
      type:'text',
      leftIcon:'search',
      className: 'bp3-large',
      rightElement:<SearchAlert queryText={searchValue}/>,
      placeholder,
      value: searchValue,
      id:'search-box'
    };

    const popoverProps = {
      popoverClassName:'search-popover',
      usePortal: false,
      targetTagName: 'div',
      modifiers:{
        arrow: {enabled: false}
      },
    };

    if(!this.props.session.loggedIn || searchValue){
      Object.assign(popoverProps, {isOpen:false})
    }

    return (<Suggest
      inputProps={inputProps}
      popoverProps={popoverProps}
      items={this.props.queryLogs.results}
      itemRenderer={itemRenderer}
      inputValueRenderer={({ text }) => text}
      onQueryChange={onChange}
      query={searchValue}
      itemListPredicate={queryLogItems}
      className="navbar-search-input"
      onItemSelect={onItemSelect}
      resetOnQuery={true}
    />);
  }
}

const mapStateToProps = (state) => ({
  session: selectSession(state),
  queryLogs: selectQueryLogsLimited(state),
  query:  Query.fromLocation('querylog', window.location, {}, 'querylog').limit(20)
});
const mapDispatchToProps = ({
  fetchQueryLogs
});

export default  connect(
  mapStateToProps,
  mapDispatchToProps
)(
  withRouter(SearchBox)
)

