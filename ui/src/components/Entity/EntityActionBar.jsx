import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Boundary, Button, ButtonGroup, ControlGroup, Divider, OverflowList } from '@blueprintjs/core';
import { Popover2 as Popover } from '@blueprintjs/popover2';
import c from 'classnames';
import { ResultText, SearchBox, UpdateStatus } from 'components/common';
import { selectEntitiesResult } from 'selectors';

import './EntityActionBar.scss';

class EntityActionBar extends Component {
  overflowListRenderer = (overflowItems) => {
    const menuContent = overflowItems.map((item, i) => <React.Fragment key={i}>{item}</React.Fragment>);
    return (
      <Popover
        content={<ButtonGroup vertical minimal alignText="left">{menuContent}</ButtonGroup>}
        placement="bottom-start"
        minimal
        popoverClassName="EntityActionBar__overflow-list"
      >
        <Button icon="caret-down" />
      </Popover>
    );
  }

  render() {
    const { children, query, result, onSearchSubmit, searchDisabled, searchPlaceholder, updateStatus, writeable } = this.props;
    const showActions = writeable && children;
    const resultText = query.hasQuery() && <ResultText result={result} />;

    return (
      <div className="EntityActionBar">
        <ControlGroup fill className={c({"show-status":!!updateStatus})}>
          <OverflowList
            items={showActions ? children : [resultText]}
            collapseFrom={Boundary.END}
            visibleItemRenderer={(item, i) => <React.Fragment key={i}>{item}</React.Fragment>}
            overflowRenderer={this.overflowListRenderer}
            className="bp3-button-group"
            minVisibleItems={showActions ? 0 : 1}
            observeParents
          />
          <div className="EntityActionBar__right">
            {updateStatus && (
              <>
                <UpdateStatus status={updateStatus} />
                <Divider />
              </>
            )}
            <SearchBox
              onSearch={onSearchSubmit}
              placeholder={searchPlaceholder}
              query={query}
              inputProps={{ disabled: searchDisabled }}
            />
          </div>
        </ControlGroup>
        {showActions && (
          <div className="EntityActionBar__secondary">
            {resultText}
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  return {
    result: selectEntitiesResult(state, query)
  };
};


export default connect(mapStateToProps)(EntityActionBar);
