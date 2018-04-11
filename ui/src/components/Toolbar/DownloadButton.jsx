import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Popover, PopoverInteractionKind, Position } from "@blueprintjs/core";

export class DownloadButton extends React.Component {
    render() {
        const { session, document: doc, isPreview } = this.props;
        const className = isPreview === true ? this.props.className : '';

        // @TODO If email w/ attachments then pass them as array of download options
        let downloadLink;
        if (doc && doc.links && doc.links.file) {
            downloadLink = { name: '', url: doc.links.file }
        }

        if (session && downloadLink) {
            if (Array.isArray(downloadLink)) {
                // If passed an array, rrender Download button with multiple options
                let popoverContent = (
                    <ul className="pt-menu">
                        {downloadLink.map((item,i) => {
                            return <li key={i}><a className="pt-menu-item" href={item.url}>{item.name}</a></li>
                        })}
                    </ul>
                );
                return (
                    <div className={`DownloadButton pt-button-group ${className}`} style={this.props.style}>
                        <a href={session.token ? `${downloadLink[0].url}?api_key=${session.token}` : downloadLink[0].url} className="pt-button">
                            <span className="pt-icon-standard pt-icon-download"/>
                            <span><FormattedMessage id="document.download" defaultMessage="Download"/></span>
                        </a>
                        <Popover
                            content={popoverContent}
                            interactionKind={PopoverInteractionKind.CLICK}
                            position={Position.BOTTOM_RIGHT}
                            modifiers={{
                                arrow: { enabled: false },
                                preventOverflow: { enabled: false, boundariesElement: "scrollParent" }
                            }}
                        >
                            <div className="pt-button pt-icon-caret-down"/>
                        </Popover>
                    </div>
                );
            } else {
                // Render Download button with single button
                return (
                    <a href={session.token ? `${downloadLink.url}?api_key=${session.token}` : downloadLink.url} type="button" className={`DownloadButton pt-button ${className}`} style={this.props.style}>
                        <span className="pt-icon-standard pt-icon-download"/>
                        <span><FormattedMessage id="document.download" defaultMessage="Download"/></span>
                    </a>
                );
            }
        } else {
            // Render disabled control
            return (
                <button type="button" className="DownloadButton pt-button" disabled style={this.props.style}>
                    <span className="pt-icon-standard pt-icon-download"/>
                    <span><FormattedMessage id="document.download" defaultMessage="Download"/></span>
                </button>
            );
        }
    }
}

const mapStateToProps = state => ({
    session: state.session,
});

export default connect(mapStateToProps)(DownloadButton);