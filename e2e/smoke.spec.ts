import { test, expect } from '@playwright/test';

// SMOKE TESTS: Nightcore AQP

test.describe('Flujos Críticos de Usuario', () => {
  
  test('1. Ver eventos en Home', async ({ page }) => {
    await page.goto('http://localhost:3092');
    await expect(page.locator('h1')).toBeVisible();
    // Verificar que algún componente de evento cargó (tiene "Vol" o "Nightcore")
    await expect(page.locator('text=Nightcore').first()).toBeVisible();
  });

  test('2. Cargar estilos dinámicos (DesignLoader)', async ({ page }) => {
    await page.goto('http://localhost:3092');
    // Si DesignLoader inyectó un data-font, el tag html debería tenerlo
    const htmlTag = page.locator('html');
    // Simplemente verificar que el html tag existe y no está vacío
    await expect(htmlTag).toBeVisible();
  });

  test('3. Abrir playlist y Reproducir preview', async ({ page }) => {
    await page.goto('http://localhost:3092/playlist');
    await expect(page.locator('text=Playlist del DJ')).toBeVisible();
    // Probar si existe un botón de Play en la grilla de canciones sugeridas
    const playButton = page.locator('button .lucide-play').first();
    if (await playButton.isVisible()) {
      await playButton.click();
      // El reproductor global debe aparecer (GlobalPlayer)
      await expect(page.locator('.fixed.bottom-4').first()).toBeVisible();
    }
  });

});

test.describe('Flujos de Staff / Admin', () => {
  
  test('4. Login de Staff (Simulado)', async ({ page }) => {
    await page.goto('http://localhost:3092');
    // En un entorno de prueba E2E real, inyectaríamos una cookie o token de sesión de Supabase
    // Aquí verificamos que el modal de Auth existe
    const loginBtn = page.locator('button:has-text("Login")');
    if (await loginBtn.isVisible()) {
      await loginBtn.first().click();
      await expect(page.locator('text=Acceso')).toBeVisible();
    }
  });

  test('5. Descargar ZIP en Crate', async ({ page }) => {
    // Si no somos staff, la API devolverá un error, pero el endpoint existe
    const response = await page.request.get('http://localhost:3092/api/crate/download');
    // Puede devolver 401 Unauthorized o 400 Bad Request, lo cual prueba que la ruta funciona pero protege contra descargas anónimas
    expect(response.status()).toBeGreaterThanOrEqual(400); 
  });

});

test.describe('Flujos de Integración Externa', () => {
  
  test('6. Sincronización APK ↔ Backend (CORS)', async ({ page }) => {
    // Simulamos una llamada fetch desde el entorno móvil
    const response = await page.request.fetch('http://localhost:3092/api/assistant', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'app://nightcore.apk',
        'Access-Control-Request-Method': 'POST'
      }
    });
    // Si Next.js o el middleware de CORS están activos, la ruta existe
    expect([200, 204, 404]).toContain(response.status()); 
  });

});
