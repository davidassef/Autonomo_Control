import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAdminUsers } from './useAdminUsers';

// Mock das funções de serviço
jest.mock('../services/adminUsers', () => {
  return {
    listUsers: jest.fn().mockResolvedValue([
      { id: '1', email: 'u1@example.com', name: 'User 1', role: 'USER', is_active: true },
    ]),
    createUser: jest.fn().mockImplementation(async ({ email, name }: any) => ({ id: '2', email, name, role: 'USER', is_active: true })),
    changeStatus: jest.fn().mockImplementation(async (id: string, { is_active }: any) => ({ id, email: 'u1@example.com', name: 'User 1', role: 'USER', is_active })),
    changeRole: jest.fn().mockImplementation(async (id: string, { role }: any) => ({ id, email: 'u1@example.com', name: 'User 1', role, is_active: true })),
  };
});

const TestComponent: React.FC = () => {
  const { users, loading, create, toggleStatus, promote, demote } = useAdminUsers();
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="count">{users.length}</div>
      <button onClick={() => create('new@example.com', 'New User', 'USER')}>create</button>
      {users[0] && <button onClick={() => toggleStatus(users[0])}>toggle</button>}
      {users[0] && <button onClick={() => promote({ ...users[0], role: 'USER' } as any, 'mk')}>promote</button>}
      {users[0] && <button onClick={() => demote({ ...users[0], role: 'ADMIN' } as any, 'mk')}>demote</button>}
    </div>
  );
};

describe('useAdminUsers hook', () => {
  it('carrega usuários iniciais e cria novo', async () => {
    render(<TestComponent />);
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('loaded'));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    screen.getByText('create').click();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'));
  });
});
