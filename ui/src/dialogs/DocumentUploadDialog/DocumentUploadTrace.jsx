// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Spinner, Icon } from "@blueprintjs/core";
import { UPLOAD_STATUS } from "./DocumentUploadStatus";

export default function DocumentUploadTrace({ trace }) {
  const renderStatus = () => {
    if (trace.status === UPLOAD_STATUS.PENDING) {
      if (trace.uploaded > 0) {
        return <Spinner intent="primary" size={Spinner.SIZE_SMALL} value={trace.uploaded / trace.total} />
      } else {
        return <span />
      }
    } else if (trace.status === UPLOAD_STATUS.SUCCESS) {
      return <Icon intent="success" icon="tick-circle" iconSize={Spinner.SIZE_SMALL} />
    } else if (trace.status === UPLOAD_STATUS.ERROR) {
      return <Icon intent="danger" icon="error" iconSize={Spinner.SIZE_SMALL} />
    }
  }

  return <li className='DocumentUploadTrace'>
    <div className='DocumentUploadTrace__label'>{trace.name}</div>
    <div className='DocumentUploadTrace__status'>
      {renderStatus()}
    </div>
  </li>
}
