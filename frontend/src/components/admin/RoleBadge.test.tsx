import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoleBadge } from './RoleBadge';

describe('RoleBadge', () => {
  it('renderiza role', () => {
    render(<RoleBadge role="ADMIN" />);
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });
});
