import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserTable } from './UserTable';

const baseUser = { id: '1', email: 'a@a.com', name: 'A', role: 'USER' as const, is_active: true };

describe('UserTable', () => {
  it('mostra skeleton enquanto carrega', () => {
    render(<UserTable users={[]} loading={true} actionId={null} onToggleStatus={()=>{}} onPromote={()=>{}} onDemote={()=>{}} onResetPassword={async ()=>{}} onBlock={async ()=>{}} onUnblock={async ()=>{}} onDelete={async ()=>{}} />);
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1); // header + skeleton rows
  });
  it('mostra empty state', () => {
    render(<UserTable users={[]} loading={false} actionId={null} onToggleStatus={()=>{}} onPromote={()=>{}} onDemote={()=>{}} onResetPassword={async ()=>{}} onBlock={async ()=>{}} onUnblock={async ()=>{}} onDelete={async ()=>{}} />);
    expect(screen.getByText(/Nenhum usuário encontrado/i)).toBeInTheDocument();
  });
  it('renderiza usuário', () => {
    render(<UserTable users={[baseUser]} loading={false} actionId={null} onToggleStatus={()=>{}} onPromote={()=>{}} onDemote={()=>{}} onResetPassword={async ()=>{}} onBlock={async ()=>{}} onUnblock={async ()=>{}} onDelete={async ()=>{}} />);
    expect(screen.getByText('a@a.com')).toBeInTheDocument();
  });
});
