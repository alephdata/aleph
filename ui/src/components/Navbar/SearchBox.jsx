import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import {withRouter} from 'react-router';

import { Suggest } from 'src/components/common/Suggest';
import { MenuItem } from "@blueprintjs/core/lib/esm/components/menu/menuItem";
import SearchAlert from 'src/components/SearchAlert/SearchAlert'
import {selectQueryLogsLimited, selectSession} from 'src/selectors';
import {fetchQueryLogs} from 'src/actions/queryLogsActions';
import Query from "../../app/Query";



const ICON_VIRTUAL_SUGGEST = 'edit';
const ICON_EXISTING_SUGGEST = 'arrow-right';


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

  onChange = ({target}) => this.props.updateSearchValue(target.value);

  onItemSelect = ({text}) => {
    this.props.updateSearchValue(text);
    this.props.doSearch(text);
  };

  itemRenderer =  (queryItem, { handleClick, modifiers }) => {
    const icon = queryItem.isVirtual ? ICON_VIRTUAL_SUGGEST : ICON_EXISTING_SUGGEST;

    return ( <MenuItem
        icon={icon}
        active={modifiers.active}
        className="navbar-search-item"
        key={queryItem.text}
        onClick={handleClick}
        text={queryItem.text }
      />);
  };

  get queryLogItems(){
    return this.props.searchValue ? [{text:this.props.searchValue, isVirtual: true}] : this.props.queryLogs.result
  }

  render() {
    const {
      props: { placeholder, searchValue },
      itemRenderer, onChange,
      queryLogItems
    } = this;
    const inputProps = {
      type:'text',
      leftIcon:'search',
      value:searchValue,
      className:'pt-large',
      rightElement:<SearchAlert queryText={searchValue}/>,
      onChange,
      placeholder,
      id:'search-box'
    };

    const popoverProps = {
      popoverClassName:'search-popover',
      usePortal: false,
      modifiers:{
        arrow: {enabled: false}
      },
    };

    if(!this.props.session.loggedIn){
      Object.assign(popoverProps, {isOpen:false})
    }

    return (<Suggest
      inputProps={inputProps}
      popoverProps={popoverProps}
      items={queryLogItems}
      itemRenderer={itemRenderer}
      inputValueRenderer={({ text }) => text}
      className="navbar-search-input"
      onItemSelect={this.onItemSelect}
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

