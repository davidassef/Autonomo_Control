import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MasterPasswordPrompt } from './MasterPasswordPrompt';

describe('MasterPasswordPrompt', () => {
  it('chama onConfirm com a master key', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<MasterPasswordPrompt title="Teste" onConfirm={onConfirm} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/master password/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('secret'));
  });
});
