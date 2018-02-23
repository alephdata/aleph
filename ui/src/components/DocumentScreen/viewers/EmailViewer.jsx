import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Tab, Tabs } from "@blueprintjs/core";

import SearchContext from 'src/components/search/SearchContext';
import SearchResult from 'src/components/search/SearchResult';
import Toolbar from 'src/components/common/Toolbar/DocumentToolbar';

import './EmailViewer.css';

class EmailViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTabId: 'email'
    };
    this.handleTabChange = this.handleTabChange.bind(this);
  }
  
  handleTabChange(activeTabId: TabId) {
    this.setState({ activeTabId });
  }
  
  render() {
    const { document } = this.props;
    const { headers = {} } = document;
    const context = {
      'filter:parent.id': document.id
    };
    const aspects = {
      filter: false,
      countries: false,
      collections: false
    };
    
    return (
      <React.Fragment>
        <Toolbar document={document}/>
        <div className="ContentPaneOuter">
          <div className="ContentPaneInner EmailViewer" style={{padding: '10px 20px 0 20px'}}>
          <Tabs id="EmailTabs"  large="true" onChange={this.handleTabChange} selectedTabId={this.state.activeTabId}>
            <Tab id="email"
              title={
                <React.Fragment>
                   <span className="pt-icon-standard pt-icon-envelope"/> <FormattedMessage id="document.email.body" defaultMessage="Email Message"/>
                </React.Fragment>
              }
              panel={
                <React.Fragment>
                  <table style={{margin: '0 -20px'}}>
                      <tbody>
                          {headers.date && (
                            <tr>
                              <th><FormattedMessage id="email.date" defaultMessage="Date"/></th>
                              <td>{headers.date}</td>
                            </tr>
                          )}
                          {headers.from && (
                            <tr>
                              <th><FormattedMessage id="email.from" defaultMessage="From"/></th>
                              <td>{headers.from}</td>
                            </tr>
                          )}
                          <tr>
                            <th><FormattedMessage id="email.subject" defaultMessage="Subject"/></th>
                            <td>{headers.subject}</td>
                          </tr>
                          {headers.to && (
                            <tr>
                              <th><FormattedMessage id="email.to" defaultMessage="Recipient"/></th>
                              <td>{headers.to}</td>
                            </tr>
                          )}
                          {headers.cc && (
                            <tr>
                              <th><FormattedMessage id="email.cc" defaultMessage="CC"/></th>
                              <td>{headers.cc}</td>
                            </tr>
                          )}
                          {headers.bcc && (
                            <tr>
                              <th><FormattedMessage id="email.bcc" defaultMessage="BCC"/></th>
                              <td>{headers.bcc}</td>
                            </tr>
                          )}
                          {!!document.children && (
                            <tr>
                              <th><FormattedMessage id="email.attachment" defaultMessage="Attachments"/></th>
                              <td>
                                <a href="#children" onClick={() => {this.setState({activeTabId: 'attachments'})}}>
                                  <span className="pt-icon-standard pt-icon-paperclip"/>
                                  {' '}
                                  <FormattedMessage id="email.attachment.count"
                                                    defaultMessage="{count} attached files"
                                                    values={{
                                                      count: document.children
                                                    }} />
                                </a>
                              </td>
                            </tr>
                          )}
                      </tbody>
                  </table>
                  <pre style={{padding: '10px 20px 20px 20px'}}>{document.text}</pre>
                </React.Fragment>
              } 
            />
            {!!document.children && (
              <Tab id="attachments"
                title={
                  <React.Fragment>
                     <span className="pt-icon-standard pt-icon-paperclip"/> <FormattedMessage id="document.email.attachments" defaultMessage="Attachments"/>
                  </React.Fragment>
                }
                panel={
                  <div style={{margin: '0 -20px'}}>
                    <SearchContext context={context} aspects={aspects}>{searchContext => (
                      <div>
                        <SearchResult {...searchContext} />
                      </div>
                    )}</SearchContext>
                  </div>
                } 
              />
            )}
           </Tabs>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default EmailViewer;
