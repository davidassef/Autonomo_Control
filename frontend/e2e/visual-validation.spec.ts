import { test, expect } from '@playwright/test';

test.describe('Sistema Autonomo Control - Validação Visual', () => {
  test('deve ter layout responsivo na página de login', async ({ page }) => {
    await page.goto('/');
    
    // Testar em diferentes tamanhos de tela
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('form')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('form')).toBeVisible();
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('form')).toBeVisible();
  });

  test('deve ter elementos visuais consistentes', async ({ page }) => {
    await page.goto('/');
    
    // Verificar cores e estilos principais
    const loginButton = page.getByRole('button', { name: /entrar/i });
    await expect(loginButton).toHaveCSS('background-color', /rgb\(/);
    
    // Verificar se inputs têm bordas visíveis
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveCSS('border-width', /px/);
  });

  test('deve carregar sem erros de console críticos', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');
    
    // Filtrar apenas erros críticos (não warnings de desenvolvimento)
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('DevTools') &&
      !error.includes('Extension')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('deve ter performance aceitável', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Página deve carregar em menos de 5 segundos
    expect(loadTime).toBeLessThan(5000);
  });

  test('deve ter acessibilidade básica', async ({ page }) => {
    await page.goto('/');
    
    // Verificar se inputs têm labels ou placeholders
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toHaveAttribute('placeholder');
    await expect(passwordInput).toHaveAttribute('placeholder');
    
    // Verificar se botões têm texto descritivo
    const submitButton = page.getByRole('button', { name: /entrar/i });
    await expect(submitButton).toBeVisible();
  });
});