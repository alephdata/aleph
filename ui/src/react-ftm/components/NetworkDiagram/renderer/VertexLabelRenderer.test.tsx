import React from 'react';
import { render, screen } from '@testing-library/react';
import { VertexLabelRenderer } from './VertexLabelRenderer';
import { Point } from '../layout/Point';

const renderLabel = (label = '', selected = false) =>
  render(
    <svg data-testid="diagram">
      <VertexLabelRenderer
        type="text"
        label={label}
        selected={selected}
        center={new Point(0, 0)}
      />
    </svg>
  );

describe('<VertexLabelRenderer />', () => {
  it('renders text labels', () => {
    renderLabel('Lorem ipsum dolor sit amet.');
    expect(screen.getByTestId('diagram')).toHaveTextContent(
      'Lorem ipsum dolor sit amet.'
    );
  });

  it('truncates long labels', () => {
    renderLabel(
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.'
    );
    expect(screen.getByTestId('diagram')).toHaveTextContent(
      'Lorem ipsum dolor sit amet, co…'
    );
  });

  it('display untruncated label when selected', () => {
    const { container } = renderLabel(
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.',
      true
    );

    const tspans = Array.from(container.querySelectorAll('svg tspan'));
    const lines = tspans.map((tspan) => tspan.textContent);
    const verticalLineDelta = tspans.map((tspan) => tspan.getAttribute('dy'));

    expect(lines).toEqual([
      'Lorem ipsum dolor sit amet,',
      'consectetuer adipiscing elit.',
      'Aenean commodo ligula eget',
      'dolor. Aenean massa.',
    ]);

    expect(verticalLineDelta).toEqual(['0', '5.5', '5.5', '5.5']);
  });
});
