import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MasterPasswordPrompt } from './MasterPasswordPrompt';

describe('MasterPasswordPrompt errors', () => {
  it('exibe mensagem master password inválida', async () => {
    const onConfirm = jest.fn().mockRejectedValue({ response: { status: 403, data: { detail: 'Master password inválida' }}});
    render(<MasterPasswordPrompt title="Teste" onConfirm={onConfirm} onClose={()=>{}} />);
    fireEvent.change(screen.getByLabelText(/master password/i), { target: { value: 'x' } });
    fireEvent.click(screen.getByText('Confirmar'));
    await screen.findByText(/Master password inválida/i);
  });
});
