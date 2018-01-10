import React, {Component} from 'react';
import {FormattedMessage} from 'react-intl';

import Schema from 'src/components/common/Schema';
import Country from 'src/components/common/Country';
import Language from 'src/components/common/Language';
import Date from 'src/components/common/Date';
import FileSize from 'src/components/common/FileSize';
import Entity from 'src/components/EntityScreen/Entity';

import './DocumentMetadata.css';

class DocumentMetadata extends Component {
    render() {
        const {document} = this.props;
        return (
            <table className='document_metadata_table'>
                <tbody>
                <tr>
                    <th className="th_class"><FormattedMessage id="document.type" defaultMessage="Type"/></th>
                    <td>
                        <Schema.Icon schema={document.schema}/>
                        <Schema.Name className='schema_name td_class' schema={document.schema}/>
                    </td>
                </tr>
                {document.file_name && (
                    <tr>
                        <th className="th_class"><FormattedMessage id="document.file_name" defaultMessage="File name"/>
                        </th>
                        <td className='td_class'>{document.file_name}</td>
                    </tr>
                )}
                {document.file_size && (
                    <tr>
                        <th className="th_class"><FormattedMessage id="document.file_size" defaultMessage="File size"/>
                        </th>
                        <td className='td_class'><FileSize value={document.file_size}/></td>
                    </tr>
                )}
                {document.parent && (
                    <tr>
                        <th className="th_class"><FormattedMessage id="document.parent" defaultMessage="Folder"/></th>
                        <td className='td_class'><Entity.Link iconClass='icon_margin_right' entity={document.parent}
                                                              icon short/></td>
                    </tr>
                )}
                {document.author && (
                    <tr>
                        <th className="th_class"><FormattedMessage id="document.author" defaultMessage="Author"/></th>
                        <td className='td_class'>{document.author}</td>
                    </tr>
                )}
                {document.generator && (
                    <tr>
                        <th className="th_class"><FormattedMessage id="document.generator" defaultMessage="Generator"/>
                        </th>
                        <td className='td_class'>{document.generator}</td>
                    </tr>
                )}
                {document.languages && document.languages.length > 0 && (
                    <tr>
                        <th className="th_class"><FormattedMessage id="document.languages" defaultMessage="Languages"/>
                        </th>
                        <td className='td_class'><Language.List codes={document.languages}/></td>
                    </tr>
                )}
                {document.countries && document.countries.length > 0 && (
                    <tr>
                        <th className="th_class"><FormattedMessage id="document.countries" defaultMessage="Countries"/>
                        </th>
                        <td className='td_class'><Country.List codes={document.countries}/></td>
                    </tr>
                )}
                {document.date && (
                    <tr>
                        <th className="th_class"><FormattedMessage id="document.date" defaultMessage="Date"/></th>
                        <td className='td_class'><Date value={document.date}/></td>
                    </tr>
                )}
                {document.authored_at && (
                    <tr>
                        <th className="th_class"><FormattedMessage id="document.authored_at" defaultMessage="Authored"/>
                        </th>
                        <td className='td_class'><Date value={document.authored_at}/></td>
                    </tr>
                )}
                {document.modified_at && (
                    <tr>
                        <th className="th_class"><FormattedMessage id="document.modified_at" defaultMessage="Modified"/>
                        </th>
                        <td className='td_class'><Date value={document.modified_at}/></td>
                    </tr>
                )}
                {document.retrieved_at && (
                    <tr>
                        <th className="th_class"><FormattedMessage id="document.retrieved_at"
                                                                   defaultMessage="Retrieved"/></th>
                        <td className='td_class'><Date value={document.retrieved_at}/></td>
                    </tr>
                )}
                {document.updated_at && (
                    <tr>
                        <th className="th_class"><FormattedMessage id="document.updated_at" defaultMessage="Imported"/>
                        </th>
                        <td className='td_class'><Date value={document.updated_at}/></td>
                    </tr>
                )}
                {document.mime_type && (
                    <tr>
                        <th className="th_class"><FormattedMessage id="document.mime_type" defaultMessage="MIME"/></th>
                        <td className='td_class'>{document.mime_type}</td>
                    </tr>
                )}
                </tbody>
            </table>
        );
    }
}

export default DocumentMetadata;
