// Pruebas end-to-end BDD (Playwright): navegador real + servidor real
const { test, expect } = require('@playwright/test');

// abre el chat y espera a que el socket este conectado
async function abrirChat(page, nombre) {
  await page.goto('/');
  await page.waitForFunction(() => window.io !== undefined);
  if (nombre) {
    await page.fill('#nombre', nombre);
  }
}

async function enviar(page, texto) {
  await page.fill('#m', texto);
  await page.click('form button');
}

function ultimoMensaje(page) {
  return page.locator('#messages li').last();
}

test.describe('Feature: Chat UNA en el navegador', () => {

  test('Scenario: el usuario envia un mensaje de texto', async ({ page }) => {
    await test.step('Given el usuario "Ana" abre el chat', async () => {
      await abrirChat(page, 'Ana');
    });
    await test.step('When escribe "Hola a todos" y presiona Send', async () => {
      await enviar(page, 'Hola a todos');
    });
    await test.step('Then el mensaje aparece en el chat con su nombre', async () => {
      await expect(ultimoMensaje(page)).toHaveText('Ana: Hola a todos');
      await expect(page.locator('#m')).toHaveValue('');
    });
  });

  test('Scenario: otro usuario recibe el mensaje en tiempo real', async ({ browser }) => {
    const ana = await browser.newPage();
    const luis = await browser.newPage();

    await test.step('Given "Ana" y "Luis" tienen el chat abierto', async () => {
      await abrirChat(ana, 'Ana');
      await abrirChat(luis, 'Luis');
    });
    await test.step('When Ana envia un mensaje', async () => {
      await enviar(ana, 'Hola Luis');
    });
    await test.step('Then Luis lo ve en su pantalla', async () => {
      await expect(ultimoMensaje(luis)).toHaveText('Ana: Hola Luis');
    });

    await ana.close();
    await luis.close();
  });

  test('Scenario: el usuario comparte una URL de imagen', async ({ page }) => {
    const url = 'https://www.w3schools.com/html/pic_trulli.jpg';

    await test.step('Given el usuario abre el chat', async () => {
      await abrirChat(page, 'Ana');
    });
    await test.step(`When envia ${url}`, async () => {
      await enviar(page, url);
    });
    await test.step('Then la imagen se muestra dentro del chat', async () => {
      const img = ultimoMensaje(page).locator('img.chat-media');
      await expect(img).toBeVisible();
      await expect(img).toHaveAttribute('src', url);
    });
  });

  test('Scenario: el usuario comparte una URL de video', async ({ page }) => {
    const url = 'https://www.w3schools.com/html/mov_bbb.mp4';

    await test.step('Given el usuario abre el chat', async () => {
      await abrirChat(page, 'Ana');
    });
    await test.step(`When envia ${url}`, async () => {
      await enviar(page, url);
    });
    await test.step('Then se inserta un reproductor de video con controles', async () => {
      const video = ultimoMensaje(page).locator('video.chat-media');
      await expect(video).toBeVisible();
      await expect(video).toHaveAttribute('src', url);
      await expect(video).toHaveAttribute('controls', '');
    });
  });

  test('Scenario: el usuario comparte un video de YouTube', async ({ page }) => {
    await test.step('Given el usuario abre el chat', async () => {
      await abrirChat(page, 'Ana');
    });
    await test.step('When envia un link de YouTube', async () => {
      await enviar(page, 'https://youtu.be/dQw4w9WgXcQ');
    });
    await test.step('Then se inserta el reproductor embebido de YouTube', async () => {
      const iframe = ultimoMensaje(page).locator('iframe.chat-media');
      await expect(iframe).toBeVisible();
      await expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
    });
  });

  test.describe('Scenario Outline: un atacante intenta inyectar scripts', () => {
    const ataques = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      'http://x.com/a.jpg" onerror="alert(1)',
    ];

    for (const ataque of ataques) {
      test(`Ejemplo: ${ataque}`, async ({ page }) => {
        const alertas = [];
        page.on('dialog', async (dialog) => {
          alertas.push(dialog.message());
          await dialog.dismiss();
        });

        await test.step('Given un atacante abre el chat', async () => {
          await abrirChat(page, 'Hacker');
        });
        await test.step('When envia el ataque como mensaje', async () => {
          await enviar(page, ataque);
        });
        await test.step('Then el ataque se muestra como texto y no se ejecuta', async () => {
          const mensaje = ultimoMensaje(page);
          await expect(mensaje).toHaveText(`Hacker: ${ataque}`);
          await expect(mensaje.locator('script, img, svg, iframe, video')).toHaveCount(0);
          await page.waitForTimeout(300);
          expect(alertas).toEqual([]);
        });
      });
    }

    test('Ejemplo: HTML en el nombre de usuario', async ({ page }) => {
      const alertas = [];
      page.on('dialog', async (dialog) => {
        alertas.push(dialog.message());
        await dialog.dismiss();
      });

      await test.step('Given un atacante usa "<img src=x onerror=alert(1)>" como nombre', async () => {
        await abrirChat(page, '<img src=x onerror=alert(1)>');
      });
      await test.step('When envia un mensaje', async () => {
        await enviar(page, 'hola');
      });
      await test.step('Then el nombre se muestra como texto y no se ejecuta', async () => {
        const mensaje = ultimoMensaje(page);
        await expect(mensaje).toHaveText('<img src=x onerror=alert(1)>: hola');
        await expect(mensaje.locator('img')).toHaveCount(0);
        await page.waitForTimeout(300);
        expect(alertas).toEqual([]);
      });
    });
  });

});
