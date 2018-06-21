import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { FormattedMessage } from 'react-intl';
import { Tab, Tabs } from "@blueprintjs/core";

import Query from 'src/app/Query';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';

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
    const { document, query } = this.props;
    const { headers = {} } = document;
    
    // Render mesage body (with preference for HTML version)
    let messageBody = <p className="email-no-body pt-text-muted">
        <FormattedMessage id="email.body.empty" defaultMessage="No message body."/>
      </p>
    if (document.html && document.html.length) {
      messageBody = <span className="email-body" dangerouslySetInnerHTML={{__html: document.html}}/>
    } else if (document.text && document.text.length > 0) {
      messageBody = <pre className="email-body">{document.text}</pre>
    }
    
    return (
      <React.Fragment>
        <div className="outer">
          <div className="inner EmailViewer">
            <div className="email-header">
              <table className="pt-html-table">
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
                </tbody>
              </table>
            </div>
            <Tabs id="EmailTabs" onChange={this.handleTabChange} selectedTabId={this.state.activeTabId}>
              <Tab id="email"
                title={
                  <React.Fragment>
                    <span className="pt-icon-standard pt-icon-envelope"/>
                    {' '}
                    <FormattedMessage id="email.body" defaultMessage="Message"/>
                  </React.Fragment>
                }
                panel={messageBody} 
              />
              <Tab id="attachments"
                disabled={!document.children}
                title={
                  <React.Fragment>
                    <span className="pt-icon-standard pt-icon-paperclip"/>
                    {' '}
                    {!!document.children && (
                      <React.Fragment>
                        <FormattedMessage id="email.attachments" defaultMessage="Attachments"/>
                        <span className="pt-tag pt-round pt-intent-primary">{document.children}</span>
                      </React.Fragment>
                    )}
                    {!document.children && (
                      <FormattedMessage id="email.no_attachments" defaultMessage="No Attachments"/>
                    )}
                  </React.Fragment>
                }
               panel={
                 document.children && <div className="email-attachments">
                     <EntitySearch query={query}
                                  hideCollection={true}
                                  documentMode={true}/>
                  </div>
                } 
              />
           </Tabs>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { document, location } = ownProps;
  // For showing attachments
  const q = Query.fromLocation('search', location, {}, 'document').getString('q'),
        field = q.length === 0 ? 'filter:parent.id' : 'filter:ancestors',
        context = {[field]: document.id};
  const query = Query.fromLocation('search', location, context, 'document').limit(50);
  return {
    query: query
  }
}

EmailViewer = connect(mapStateToProps)(EmailViewer);
EmailViewer = withRouter(EmailViewer);
export default EmailViewer;
