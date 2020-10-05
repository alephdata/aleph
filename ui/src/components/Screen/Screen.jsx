import React from 'react';
import { Hotkeys, Hotkey, HotkeysTarget } from '@blueprintjs/core';
import ScreenBase from 'components/Screen/ScreenBase';


class Screen extends React.PureComponent {
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
    return <ScreenBase {...this.props} />;
  }
}


function ScreenAsAFunction() {}
ScreenAsAFunction.prototype = Object.create(Screen.prototype);

export default HotkeysTarget(ScreenAsAFunction);
