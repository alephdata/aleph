import React from 'react';
import c from 'classnames';
import { Button, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';


class ScopeSelect extends React.Component {
  renderItem = (scope, { index }) => (
    <MenuItem
      key={index}
      onClick={() => this.props.onChangeScope(scope)}
      text={scope.listItem}
    />
  )

  render() {
    const { scopes, activeScope } = this.props;
    const multipleScopes = scopes.length > 1;
    return (
      <Select
        filterable={false}
        items={scopes}
        itemRenderer={this.renderItem}
        popoverProps={{
          minimal: true,
          className: 'SearchBox__scoped-input__popover',
          usePortal: false,
        }}
        disabled={!multipleScopes}
      >
        <Button
          className={c('SearchBox__scoped-input__scope-button', { unclickable: !multipleScopes })}
          text={activeScope.listItem}
          rightIcon={multipleScopes ? 'caret-down' : null}
        />
      </Select>
    );
  }
}

export default ScopeSelect;
