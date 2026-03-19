const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR);
}

const BASE_URL = 'http://localhost:5173';

async function captureScreens() {
    console.log('🚀 Iniciando captura de pantallas...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    try {
        // --- 1. PÁGINAS PÚBLICAS ---
        console.log('📸 Capturando páginas públicas...');
        await page.goto(`${BASE_URL}/login`);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_login.png') });

        await page.goto(`${BASE_URL}/register`);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_register.png') });

        await page.goto(`${BASE_URL}/terms`);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_terms.png') });

        // --- 2. FLUJO DE USUARIO COMÚN ---
        console.log('👤 Capturando vistas de Usuario Común...');
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[type="email"]', 'usuario@armada.mil.uy');
        await page.fill('input[type="password"]', 'user123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
        
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_user_dashboard.png') });

        await page.goto(`${BASE_URL}/reserve`);
        await page.waitForTimeout(1000); // Esperar animaciones
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_reserve_step1_locations.png') });

        // Seleccionar una ubicación (ej: La Paloma)
        await page.click('text=LA PALOMA');
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_reserve_step2_cabins.png') });

        // Seleccionar una cabaña (ej: PAL-01)
        await page.click('text=PAL-01');
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_reserve_step3_calendar.png') });

        await page.goto(`${BASE_URL}/my-reservations`);
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_my_reservations.png') });

        // Logout
        await page.click('nav button:has-text("Cerrar Sesión")');
        await page.waitForURL('**/login');

        // --- 3. FLUJO DE SUPER ADMIN ---
        console.log('🔑 Capturando Panel de Administración (Super Admin)...');
        await page.fill('input[type="email"]', 'admin@armada.mil.uy');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');

        await page.goto(`${BASE_URL}/admin`);
        await page.waitForTimeout(1000);

        const tabs = [
            { id: 'Solicitudes', file: '09_admin_reservations.png' },
            { id: 'Usuarios', file: '10_admin_users.png' },
            { id: 'Unidades', file: '11_admin_cabins.png' },
            { id: 'Destinos', file: '12_admin_locations.png' },
            { id: 'Bloqueos', file: '13_admin_blocked_dates.png' },
            { id: 'Temporadas', file: '14_admin_estival.png' },
            { id: 'Auditoría', file: '15_admin_logs.png' }
        ];

        for (const tab of tabs) {
            console.log(`   - Capturando pestaña: ${tab.id}`);
            await page.click(`button:has-text("${tab.id}")`);
            await page.waitForTimeout(800);
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, tab.file) });
        }

        console.log('✅ ¡Captura completada con éxito!');
        console.log(`📂 Las imágenes se encuentran en: ${SCREENSHOTS_DIR}`);

    } catch (error) {
        console.error('❌ Error durante la captura:', error);
    } finally {
        await browser.close();
    }
}

captureScreens();
