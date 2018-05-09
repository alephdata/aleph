import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withRouter} from "react-router";
import {defineMessages, injectIntl} from 'react-intl';
import {Menu, MenuItem, MenuDivider, Popover, Button, Position, Icon} from "@blueprintjs/core";

import { DualPane } from 'src/components/common';
import {getColor} from "src/util/colorScheme";

import './CaseInfo.css';

const messages = defineMessages({
  home: {
    id: 'case.info.home',
    defaultMessage: 'Home'
  },
  timeline: {
    id: 'case.info.timeline',
    defaultMessage: 'Timeline'
  },
  documents: {
    id: 'case.info.documents',
    defaultMessage: 'Documents'
  },
  notes: {
    id: 'case.info.notes',
    defaultMessage: 'Notes'
  },
});

class CaseInfo extends Component {
  constructor(props) {
    super(props);

    this.onChangeCase = this.onChangeCase.bind(this);
  }

  onChangeCase(casefile){
    const {history} = this.props;
    history.push({
      pathname: '/cases/' + casefile.id,
    });
  }

  render() {
    const { casefile, cases, intl } = this.props;
    const color = getColor(casefile.id);
    const onChange = this.onChangeCase;

    return (
      <DualPane.InfoPane className="CaseInfo with-heading">
        <Menu className='pt-large' large={true}>
          <Popover content={<Menu>
            {cases.map(function (file, index) {
              if(file.id !== casefile.id) {
                return <MenuItem onClick={(e) => onChange(file)} key={index} text={file.label} />
              }
            })}
          </Menu>} className='case-file-dropdown' icon='search' text='Case' position={Position.LEFT_TOP}>
            <Button icon={<Icon icon='square' iconSize={Icon.SIZE_LARGE} color={color} style={{backgroundColor: color, opacity: 0.6}}/>}
                    rightIcon="menu-open" className='pt-fill pt-align-left' text={casefile.label} />
          </Popover>
          <MenuDivider/>
          <MenuItem className='menu-item-padding' icon='home' text={intl.formatMessage(messages.home)}/>
          <MenuItem className='menu-item-padding' icon='timeline-events' text={intl.formatMessage(messages.timeline)}/>
          <MenuItem className='menu-item-padding' icon='folder-close' text={intl.formatMessage(messages.documents)}/>
          <MenuItem className='menu-item-padding' icon='annotation' text={intl.formatMessage(messages.notes)}/>
        </Menu>
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {

  }
};

CaseInfo = withRouter(CaseInfo);
CaseInfo = injectIntl(CaseInfo);
export default connect(mapStateToProps, { })(CaseInfo);
