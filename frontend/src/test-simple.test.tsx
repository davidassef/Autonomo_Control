import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Teste simples para verificar se Jest está funcionando
describe("Teste Simples", () => {
  it("deve renderizar um elemento básico", () => {
    const TestComponent = () => <div>Hello Test</div>;
    render(<TestComponent />);
    expect(screen.getByText("Hello Test")).toBeInTheDocument();
  });
});
