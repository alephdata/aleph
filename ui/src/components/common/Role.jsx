import React, { PureComponent, Component } from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import {
  Button, MenuItem, Classes, Alignment, Icon,
} from '@blueprintjs/core';
import { Select as BlueprintSelect } from '@blueprintjs/select';

import wordList from 'src/util/wordList';
import { suggestRoles } from 'src/actions';

import './Role.scss';

const messages = defineMessages({
  label: {
    id: 'role.select.user',
    defaultMessage: 'Choose a user',
  },
});


class RoleLabel extends PureComponent {
  render() {
    const { role, icon = true, long = false } = this.props;
    if (!role || !role.type) {
      return null;
    }
    const iconName = role.type === 'user' ? 'user' : 'shield';
    return (
      <span className="Role">
        { icon && <Icon icon={iconName} /> }
        <span>
          { long ? role.label : role.name }
        </span>
      </span>
    );
  }
}


class RoleLink extends PureComponent {
  render() {
    const { role } = this.props;
    const content = <RoleLabel {...this.props} />;
    if (role && role.type && role.type === 'group') {
      return <Link to={`/groups/${role.id}`}>{content}</Link>;
    }
    return content;
  }
}


class RoleList extends PureComponent {
  render() {
    const { roles, separateItems, truncate = Infinity } = this.props;
    if (!roles) return null;

    let names = roles.map(role => <RoleLink key={role.id} role={role} {...this.props} />);

    // Truncate if too long
    if (names.length > truncate) {
      names = [...names.slice(0, truncate), '…'];
    }
    return separateItems ? wordList(names, ' · ') : names;
  }
}


class Select extends Component {
  constructor(props) {
    super(props);
    this.state = {
      suggested: [],
    };
    this.renderRole = this.renderRole.bind(this);
    this.onSuggest = this.onSuggest.bind(this);
    this.onSelectRole = this.onSelectRole.bind(this);
  }

  static getDerivedStateFromProps(props) {
    return { isFixed: !!props.roles };
  }

  async onSuggest(query) {
    const { isFixed } = this.state;
    if (isFixed || query.length <= 3) {
      return;
    }
    const { exclude = [] } = this.props;
    const roles = await this.props.suggestRoles(query, exclude);
    this.setState({
      suggested: roles.results,
    });
  }

  onSelectRole(role, event) {
    event.stopPropagation();
    this.props.onSelect(role);
  }

  renderRole = (role, { handleClick, modifiers }) => (
    <MenuItem
      className={modifiers.active ? Classes.ACTIVE : ''}
      icon={role.type === 'user' ? 'user' : 'shield'}
      key={role.id}
      onClick={handleClick}
      text={role.label}
    />
  )

  render() {
    const { intl, role, roles } = this.props;
    const { isFixed, suggested } = this.state;
    const items = roles || suggested;
    const label = role ? role.label : intl.formatMessage(messages.label);
    return (
      <BlueprintSelect
        itemRenderer={this.renderRole}
        items={items}
        onItemSelect={this.onSelectRole}
        onQueryChange={this.onSuggest}
        popoverProps={{
          minimal: true,
          fill: true,
          // position: Position.BOTTOM_LEFT,
        }}
        inputProps={{
          fill: true,
        }}
        activeItem={role}
        filterable={!isFixed}
        resetOnQuery={!isFixed}
        resetOnClose={!isFixed}
        resetOnSelect={!isFixed}
      >
        <Button
          fill
          text={label}
          icon="user"
          rightIcon="search"
          alignText={Alignment.LEFT}
        />
      </BlueprintSelect>
    );
  }
}

class Role {
  static Label = RoleLabel;

  static Link = RoleLink;

  static List = RoleList;

  static Select = connect(null, { suggestRoles })(injectIntl(Select));;
}

export default Role;
