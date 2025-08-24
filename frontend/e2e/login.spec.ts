import { test, expect } from '@playwright/test';

test.describe('Sistema Autonomo Control - Testes de Login', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de login
    await page.goto('/');
  });

  test('deve carregar a página de login corretamente', async ({ page }) => {
    // Verificar se a página carregou
    await expect(page).toHaveTitle(/Autonomo Control/);
    
    // Verificar elementos principais da interface
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    // Preencher formulário com credenciais inválidas
    await page.fill('input[type="email"]', 'usuario@invalido.com');
    await page.fill('input[type="password"]', 'senhaerrada');
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');
    
    // Verificar se mensagem de erro aparece
    await expect(page.locator('text=Credenciais inválidas')).toBeVisible({ timeout: 5000 });
  });

  test('deve fazer login com credenciais válidas do master', async ({ page }) => {
    // Preencher formulário com credenciais do master
    await page.fill('input[type="email"]', 'masterautonomocontrol');
    await page.fill('input[type="password"]', 'Senhamaster123');
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');
    
    // Verificar redirecionamento para dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    
    // Verificar elementos do dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('deve navegar para página de registro', async ({ page }) => {
    // Clicar no link de registro
    await page.click('text=Criar conta');
    
    // Verificar redirecionamento
    await expect(page).toHaveURL(/\/register/);
    
    // Verificar elementos da página de registro
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('deve navegar para página de recuperação de senha', async ({ page }) => {
    // Clicar no link de esqueci senha
    await page.click('text=Esqueci minha senha');
    
    // Verificar redirecionamento
    await expect(page).toHaveURL(/\/forgot-password/);
    
    // Verificar elementos da página de recuperação
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /enviar/i })).toBeVisible();
  });
});