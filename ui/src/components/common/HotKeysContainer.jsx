import React from 'react';
import { Hotkeys, Hotkey, HotkeysTarget } from '@blueprintjs/core';

class HotKeysContainer extends React.PureComponent {
  constructor(props) {
    super(props);
    this.focusSearchBox = this.focusSearchBox.bind(this);
  }

  focusSearchBox() {
    const searchBox = document.querySelector('#search-box');
    if (searchBox) {
      searchBox.focus();
    }
  }

  renderHotkeys() {
    const { hotKeys = [] } = this.props;
    return (
      <Hotkeys>
        <Hotkey combo="/" label="Search" global onKeyUp={this.focusSearchBox} />
        {hotKeys.map(hotKey => (
          <Hotkey
            key={hotKey.combo + hotKey.group}
            {...hotKey}
          />
        ))}
      </Hotkeys>
    );
  }
  render() {
    return this.props.children;
  }
}

// See https://github.com/palantir/blueprint/issues/2972#issuecomment-441978641
//  - HotkeysTarget does not support wrapped es6 components, so wraps Screen component in es5 compatible function
function HotKeysContainerFunc() {}
HotKeysContainerFunc.prototype = Object.create(HotKeysContainer.prototype);

export default HotkeysTarget(HotKeysContainerFunc);
