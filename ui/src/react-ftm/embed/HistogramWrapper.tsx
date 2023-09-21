import React from 'react';
import { Histogram } from 'react-ftm/components/Histogram';

export default class HistogramWrapper extends React.Component {
  render() {
    const sampleData = [
      {
        label: 'Jan',
        tooltipLabel: '2000 / January 2000',
        count: 29,
        isUncertain: true,
        uncertainWarning:
          '*This count includes dates where no day or month is specified',
        id: '2000-01-01T00:00:00',
      },
      {
        label: 'Feb',
        tooltipLabel: 'February 2000',
        count: 0,
        isUncertain: false,
        id: '2000-02-01T00:00:00',
      },
      {
        label: 'Mar',
        tooltipLabel: 'March 2000',
        count: 0,
        isUncertain: false,
        id: '2000-03-01T00:00:00',
      },
      {
        label: 'Apr',
        tooltipLabel: 'April 2000',
        count: 0,
        isUncertain: false,
        id: '2000-04-01T00:00:00',
      },
      {
        label: 'May',
        tooltipLabel: 'May 2000',
        count: 0,
        isUncertain: false,
        id: '2000-05-01T00:00:00',
      },
      {
        label: 'Jun',
        tooltipLabel: 'June 2000',
        count: 0,
        isUncertain: false,
        id: '2000-06-01T00:00:00',
      },
      {
        label: 'Jul',
        tooltipLabel: 'July 2000',
        count: 0,
        isUncertain: false,
        id: '2000-07-01T00:00:00',
      },
      {
        label: 'Aug',
        tooltipLabel: 'August 2000',
        count: 2,
        isUncertain: false,
        id: '2000-08-01T00:00:00',
      },
      {
        label: 'Sep',
        tooltipLabel: 'September 2000',
        count: 0,
        isUncertain: false,
        id: '2000-09-01T00:00:00',
      },
      {
        label: 'Oct',
        tooltipLabel: 'October 2000',
        count: 2,
        isUncertain: false,
        id: '2000-10-01T00:00:00',
      },
      {
        label: 'Nov',
        tooltipLabel: 'November 2000',
        count: 0,
        isUncertain: false,
        id: '2000-11-01T00:00:00',
      },
      {
        label: 'Dec',
        tooltipLabel: 'December 2000',
        count: 2,
        isUncertain: false,
        id: '2000-12-01T00:00:00',
      },
    ];

    return (
      <Histogram
        data={sampleData}
        dataPropName="count"
        containerProps={{ height: 200 }}
      />
    );
  }
}
