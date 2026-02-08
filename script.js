document.addEventListener('DOMContentLoaded', () => {
    const THEME_STORAGE_KEY = 'inv_theme_v1';
    const PROFILE_STORAGE_KEY = 'inv_profile_v1';
    const DEFAULT_THEME = {
        mode: 'light',
        custom: {
            primary: '#2563eb',
            bg: '#f8fafc',
            surface: '#ffffff',
            text: '#0f172a',
        },
    };

    const DEFAULT_PROFILE = {
        name: 'User',
        email: '',
        role: 'Admin',
        photo: '',
    };

    const LOGIN_STORAGE_KEY = 'inv_login_v1';

    initTheme();

    const page = (document.body?.dataset?.page || '').trim() || inferPageFromClass();

    const STORAGE_KEY = 'inv_products_v1';
    const DEFAULT_PRODUCTS = [
        { id: 1, name: 'Kopi Gayo', price: 25000, stock: 50 },
        { id: 2, name: 'Teh Hitam', price: 18000, stock: 30 },
        { id: 3, name: 'Coklat Aceh', price: 30000, stock: 20 },
    ];

    const state = {
        products: loadProducts(),
    };

    if (page === 'login') initLogin();
    if (page === 'dashboard') initDashboard();
    if (page === 'products') initProducts();
    if (page === 'profile') initProfile();

    function initTheme() {
        // emergency reset if user picked unreadable colors
        if (new URLSearchParams(window.location.search).get('resetTheme') === '1') {
            try {
                localStorage.removeItem(THEME_STORAGE_KEY);
            } catch {
                // ignore
            }
        }

        const theme = sanitizeTheme(loadTheme());
        applyTheme(theme, { persist: false });
    }

    function initThemeControls() {
        const modeEl = document.getElementById('themeMode');
        const resetEl = document.getElementById('themeReset');
        const customWrap = document.getElementById('themeCustomFields');

        const primaryEl = document.getElementById('themePrimary');
        const primaryHexEl = document.getElementById('themePrimaryHex');
        const bgEl = document.getElementById('themeBg');
        const bgHexEl = document.getElementById('themeBgHex');
        const surfaceEl = document.getElementById('themeSurface');
        const surfaceHexEl = document.getElementById('themeSurfaceHex');
        const textEl = document.getElementById('themeText');
        const textHexEl = document.getElementById('themeTextHex');

        const dotBg = document.getElementById('themeDotBg');
        const dotSurface = document.getElementById('themeDotSurface');
        const dotPrimary = document.getElementById('themeDotPrimary');
        const dotText = document.getElementById('themeDotText');

        if (!modeEl || !resetEl || !customWrap) return;

        let theme = loadTheme();
        syncControlsFromTheme(theme);
        updatePreviewDots(theme);

        modeEl.addEventListener('change', () => {
            const mode = String(modeEl.value || 'light');
            theme = {
                mode,
                custom: theme.custom || { ...DEFAULT_THEME.custom },
            };
            applyTheme(theme, { persist: true });
            syncControlsFromTheme(theme);
            updatePreviewDots(theme);
        });

        resetEl.addEventListener('click', () => {
            theme = { ...DEFAULT_THEME, custom: { ...DEFAULT_THEME.custom } };
            try {
                localStorage.removeItem(THEME_STORAGE_KEY);
            } catch {
                // ignore
            }
            applyTheme(theme, { persist: false });
            syncControlsFromTheme(theme);
            updatePreviewDots(theme);
        });

        bindColorPair(primaryEl, primaryHexEl, 'primary');
        bindColorPair(bgEl, bgHexEl, 'bg');
        bindColorPair(surfaceEl, surfaceHexEl, 'surface');
        bindColorPair(textEl, textHexEl, 'text');

        function bindColorPair(colorEl, hexEl, key) {
            if (!colorEl || !hexEl) return;

            const onUpdate = (raw) => {
                const hex = normalizeHex(raw);
                if (!hex) return;

                colorEl.value = hex;
                hexEl.value = hex;

                theme = loadTheme();
                const nextTheme = {
                    mode: theme.mode || 'custom',
                    custom: { ...(theme.custom || DEFAULT_THEME.custom), [key]: hex },
                };
                if (nextTheme.mode !== 'custom') nextTheme.mode = 'custom';

                applyTheme(nextTheme, { persist: true });
                syncControlsFromTheme(nextTheme);
                updatePreviewDots(nextTheme);
            };

            colorEl.addEventListener('input', () => onUpdate(colorEl.value));
            hexEl.addEventListener('input', () => {
                const v = String(hexEl.value || '').trim();
                if (v.length < 4) return;
                onUpdate(v);
            });
            hexEl.addEventListener('blur', () => {
                const hex = normalizeHex(hexEl.value);
                if (!hex) {
                    const current = loadTheme();
                    const fallback = normalizeHex(current?.custom?.[key]) || DEFAULT_THEME.custom[key];
                    hexEl.value = fallback;
                    colorEl.value = fallback;
                    return;
                }
                hexEl.value = hex;
                colorEl.value = hex;
            });
        }

        function syncControlsFromTheme(t) {
            const mode = t?.mode || 'light';
            modeEl.value = mode;
            customWrap.style.display = mode === 'custom' ? 'block' : 'none';

            const c = { ...DEFAULT_THEME.custom, ...(t?.custom || {}) };
            if (primaryEl) primaryEl.value = normalizeHex(c.primary) || DEFAULT_THEME.custom.primary;
            if (primaryHexEl) primaryHexEl.value = normalizeHex(c.primary) || DEFAULT_THEME.custom.primary;
            if (bgEl) bgEl.value = normalizeHex(c.bg) || DEFAULT_THEME.custom.bg;
            if (bgHexEl) bgHexEl.value = normalizeHex(c.bg) || DEFAULT_THEME.custom.bg;
            if (surfaceEl) surfaceEl.value = normalizeHex(c.surface) || DEFAULT_THEME.custom.surface;
            if (surfaceHexEl) surfaceHexEl.value = normalizeHex(c.surface) || DEFAULT_THEME.custom.surface;
            if (textEl) textEl.value = normalizeHex(c.text) || DEFAULT_THEME.custom.text;
            if (textHexEl) textHexEl.value = normalizeHex(c.text) || DEFAULT_THEME.custom.text;
        }

        function updatePreviewDots(t) {
            if (!dotBg || !dotSurface || !dotPrimary || !dotText) return;

            if (t?.mode === 'custom') {
                const c = { ...DEFAULT_THEME.custom, ...(t?.custom || {}) };
                dotBg.style.background = c.bg;
                dotSurface.style.background = c.surface;
                dotPrimary.style.background = c.primary;
                dotText.style.background = c.text;
                return;
            }

            const styles = getComputedStyle(document.documentElement);
            dotBg.style.background = styles.getPropertyValue('--bg').trim();
            dotSurface.style.background = styles.getPropertyValue('--surface').trim();
            dotPrimary.style.background = styles.getPropertyValue('--primary').trim();
            dotText.style.background = styles.getPropertyValue('--text').trim();
        }
    }

    function loadTheme() {
        try {
            const raw = localStorage.getItem(THEME_STORAGE_KEY);
            if (!raw) return { ...DEFAULT_THEME, custom: { ...DEFAULT_THEME.custom } };
            const parsed = JSON.parse(raw);
            const mode = String(parsed?.mode || DEFAULT_THEME.mode);
            const custom = {
                ...DEFAULT_THEME.custom,
                ...(parsed?.custom || {}),
            };
            return {
                mode: ['light', 'dark', 'custom'].includes(mode) ? mode : DEFAULT_THEME.mode,
                custom: {
                    primary: normalizeHex(custom.primary) || DEFAULT_THEME.custom.primary,
                    bg: normalizeHex(custom.bg) || DEFAULT_THEME.custom.bg,
                    surface: normalizeHex(custom.surface) || DEFAULT_THEME.custom.surface,
                    text: normalizeHex(custom.text) || DEFAULT_THEME.custom.text,
                },
            };
        } catch {
            return { ...DEFAULT_THEME, custom: { ...DEFAULT_THEME.custom } };
        }
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
        } catch {
            // ignore
        }
    }

    function applyTheme(theme, { persist }) {
        const safeTheme = sanitizeTheme(theme);
        const mode = safeTheme?.mode || 'light';
        const root = document.documentElement;

        if (mode === 'dark') root.setAttribute('data-theme', 'dark');
        else root.removeAttribute('data-theme');

        clearCustomThemeVars();

        if (mode === 'custom') {
            const custom = { ...DEFAULT_THEME.custom, ...(safeTheme?.custom || {}) };
            root.style.setProperty('--primary', custom.primary);
            root.style.setProperty('--primary-hover', adjustHex(custom.primary, -18));
            root.style.setProperty('--bg', custom.bg);
            root.style.setProperty('--surface', custom.surface);
            root.style.setProperty('--input-bg', custom.surface);
            root.style.setProperty('--text', custom.text);

            const ring = hexToRgba(custom.primary, 0.18);
            const ringSoft = hexToRgba(custom.primary, 0.12);
            const border = hexToRgba(custom.primary, 0.65);
            if (ring) root.style.setProperty('--focus-ring', ring);
            if (ringSoft) root.style.setProperty('--focus-ring-soft', ringSoft);
            if (border) root.style.setProperty('--focus-border', border);
        }

        if (persist) saveTheme({
            mode,
            custom: { ...DEFAULT_THEME.custom, ...(safeTheme?.custom || {}) },
        });
    }

    function sanitizeTheme(theme) {
        const mode = ['light', 'dark', 'custom'].includes(theme?.mode) ? theme.mode : DEFAULT_THEME.mode;
        const custom = {
            ...DEFAULT_THEME.custom,
            ...(theme?.custom || {}),
        };

        const safe = {
            mode,
            custom: {
                primary: normalizeHex(custom.primary) || DEFAULT_THEME.custom.primary,
                bg: normalizeHex(custom.bg) || DEFAULT_THEME.custom.bg,
                surface: normalizeHex(custom.surface) || DEFAULT_THEME.custom.surface,
                text: normalizeHex(custom.text) || DEFAULT_THEME.custom.text,
            },
        };

        if (safe.mode === 'custom') {
            const ratio = contrastRatio(safe.custom.text, safe.custom.bg);
            if (!Number.isFinite(ratio) || ratio < 2.6) {
                const bgIsLight = isLightHex(safe.custom.bg);
                safe.custom.text = bgIsLight ? '#0f172a' : '#e5e7eb';
            }
        }

        return safe;
    }

    function isLightHex(hex) {
        const rgb = hexToRgb(hex);
        if (!rgb) return true;
        return relativeLuminance(rgb) > 0.55;
    }

    function contrastRatio(fgHex, bgHex) {
        const fg = hexToRgb(fgHex);
        const bg = hexToRgb(bgHex);
        if (!fg || !bg) return NaN;
        const l1 = relativeLuminance(fg);
        const l2 = relativeLuminance(bg);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    function hexToRgb(hex) {
        const h = normalizeHex(hex);
        if (!h) return null;
        const r = parseInt(h.slice(1, 3), 16);
        const g = parseInt(h.slice(3, 5), 16);
        const b = parseInt(h.slice(5, 7), 16);
        if (![r, g, b].every(Number.isFinite)) return null;
        return { r, g, b };
    }

    function relativeLuminance({ r, g, b }) {
        const srgb = [r, g, b].map(v => v / 255).map(v => (
            v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
        ));
        return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    }

    function clearCustomThemeVars() {
        const root = document.documentElement;
        const keys = [
            '--primary', '--primary-hover', '--bg', '--surface', '--input-bg', '--text',
            '--focus-ring', '--focus-ring-soft', '--focus-border',
        ];
        keys.forEach(k => root.style.removeProperty(k));
    }

    function normalizeHex(value) {
        const v = String(value || '').trim();
        if (!v) return '';
        const hex = v.startsWith('#') ? v : `#${v}`;
        const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex);
        if (!m) return '';
        if (m[1].length === 3) {
            const r = m[1][0], g = m[1][1], b = m[1][2];
            return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
        }
        return hex.toLowerCase();
    }

    function hexToRgba(hex, alpha) {
        const h = normalizeHex(hex);
        if (!h) return '';
        const r = parseInt(h.slice(1, 3), 16);
        const g = parseInt(h.slice(3, 5), 16);
        const b = parseInt(h.slice(5, 7), 16);
        const a = Math.max(0, Math.min(1, Number(alpha)));
        if (![r, g, b].every(Number.isFinite)) return '';
        return `rgba(${r},${g},${b},${a})`;
    }

    function adjustHex(hex, amount) {
        const h = normalizeHex(hex);
        if (!h) return hex;
        const r = clamp(parseInt(h.slice(1, 3), 16) + amount);
        const g = clamp(parseInt(h.slice(3, 5), 16) + amount);
        const b = clamp(parseInt(h.slice(5, 7), 16) + amount);
        return `#${to2(r)}${to2(g)}${to2(b)}`;

        function clamp(n) { return Math.max(0, Math.min(255, n)); }
        function to2(n) { return n.toString(16).padStart(2, '0'); }
    }

    function inferPageFromClass() {
        const body = document.body;
        if (!body) return '';
        if (body.classList.contains('page-products')) return 'products';
        if (body.classList.contains('page-dashboard')) return 'dashboard';
        if (body.classList.contains('page-login')) return 'login';
        return '';
    }

    function initLogin() {
        const form = document.getElementById('loginForm');
        const emailEl = document.getElementById('email');
        const passwordEl = document.getElementById('password');
        const errorEl = document.getElementById('errorMessage');
        const rememberEl = document.getElementById('rememberMe');
        const togglePasswordEl = document.getElementById('togglePassword');
        if (!form || !emailEl || !passwordEl || !errorEl) return;

        // restore remembered email
        try {
            const raw = localStorage.getItem(LOGIN_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                const rememberedEmail = String(parsed?.email || '').trim();
                const remembered = Boolean(parsed?.remember);
                if (rememberedEmail) emailEl.value = rememberedEmail;
                if (rememberEl) rememberEl.checked = remembered;
            }
        } catch {
            // ignore
        }

        // password visibility toggle
        togglePasswordEl?.addEventListener('click', () => {
            const isPassword = passwordEl.getAttribute('type') !== 'text';
            passwordEl.setAttribute('type', isPassword ? 'text' : 'password');
            togglePasswordEl.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = String(emailEl.value || '').trim();
            const password = String(passwordEl.value || '').trim();

            const message = validateLogin(email, password);
            if (message) {
                showError(errorEl, message);
                return;
            }

            hideError(errorEl);

            // remember-me
            try {
                const remember = Boolean(rememberEl?.checked);
                localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify({
                    remember,
                    email: remember ? email : '',
                }));
            } catch {
                // ignore
            }

            // store email into profile for convenience
            const profile = loadProfile();
            if (!profile.email || profile.email !== email) {
                saveProfile({ ...profile, email });
            }
            window.location.href = 'dashboard.html';
        });
    }

    function initProfile() {
        const form = document.getElementById('profileForm');
        const resetBtn = document.getElementById('profileReset');
        const errorEl = document.getElementById('profileError');

        const nameEl = document.getElementById('profileName');
        const emailEl = document.getElementById('profileEmail');
        const roleEl = document.getElementById('profileRole');

        const avatarEl = document.getElementById('profileAvatar');
        const displayNameEl = document.getElementById('profileDisplayName');
        const displayMetaEl = document.getElementById('profileDisplayMeta');

        const photoInputEl = document.getElementById('profilePhoto');
        const photoUploadBtn = document.getElementById('profilePhotoUpload');
        const photoRemoveBtn = document.getElementById('profilePhotoRemove');

        const dotPrimary = document.getElementById('profileDotPrimary');
        const dotBg = document.getElementById('profileDotBg');
        const dotSurface = document.getElementById('profileDotSurface');

        if (!form || !nameEl || !emailEl || !roleEl || !errorEl) return;

        let profile = loadProfile();
        hydrateForm(profile);
        renderHeader(profile);
        updateThemeDots();
        syncPhotoControls(profile);

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = String(nameEl.value || '').trim();
            const email = String(emailEl.value || '').trim();
            const role = String(roleEl.value || '').trim();

            const msg = validateProfile(name, email);
            if (msg) {
                showError(errorEl, msg);
                return;
            }

            hideError(errorEl);
            profile = {
                name,
                email,
                role: role || DEFAULT_PROFILE.role,
                photo: String(profile?.photo || ''),
            };
            saveProfile(profile);
            renderHeader(profile);
            syncPhotoControls(profile);
        });

        resetBtn?.addEventListener('click', () => {
            profile = { ...DEFAULT_PROFILE };
            saveProfile(profile);
            hideError(errorEl);
            hydrateForm(profile);
            renderHeader(profile);
            syncPhotoControls(profile);
        });

        photoUploadBtn?.addEventListener('click', () => {
            photoInputEl?.click();
        });

        photoInputEl?.addEventListener('change', async () => {
            const file = photoInputEl?.files?.[0];
            if (!file) return;

            const maxBytes = 2 * 1024 * 1024;
            if (!String(file.type || '').startsWith('image/')) {
                showError(errorEl, 'File harus berupa gambar (JPG/PNG).');
                photoInputEl.value = '';
                return;
            }
            if (file.size > maxBytes) {
                showError(errorEl, 'Ukuran gambar maksimal 2MB.');
                photoInputEl.value = '';
                return;
            }

            try {
                hideError(errorEl);
                photoUploadBtn.disabled = true;

                const dataUrl = await imageFileToDataUrl(file, { maxDim: 256, quality: 0.86 });
                if (!dataUrl) throw new Error('Gagal memproses gambar.');
                if (dataUrl.length > 1_200_000) {
                    throw new Error('Gambar terlalu besar. Coba pilih gambar lain.');
                }

                profile = { ...profile, photo: dataUrl };
                saveProfile(profile);
                renderHeader(profile);
                syncPhotoControls(profile);
            } catch (err) {
                showError(errorEl, err?.message || 'Gagal mengupload foto.');
            } finally {
                if (photoUploadBtn) photoUploadBtn.disabled = false;
                if (photoInputEl) photoInputEl.value = '';
            }
        });

        photoRemoveBtn?.addEventListener('click', () => {
            profile = { ...profile, photo: '' };
            saveProfile(profile);
            renderHeader(profile);
            syncPhotoControls(profile);
        });

        function hydrateForm(p) {
            nameEl.value = String(p?.name || DEFAULT_PROFILE.name);
            emailEl.value = String(p?.email || DEFAULT_PROFILE.email);
            roleEl.value = String(p?.role || DEFAULT_PROFILE.role);
        }

        function renderHeader(p) {
            if (displayNameEl) displayNameEl.textContent = String(p?.name || DEFAULT_PROFILE.name);
            if (displayMetaEl) {
                const roleText = String(p?.role || DEFAULT_PROFILE.role);
                const emailText = String(p?.email || '').trim();
                displayMetaEl.textContent = emailText ? `${roleText} • ${emailText}` : roleText;
            }
            if (avatarEl) {
                avatarEl.textContent = getInitials(String(p?.name || DEFAULT_PROFILE.name));

                const photo = String(p?.photo || '').trim();
                if (photo) {
                    avatarEl.classList.add('has-photo');
                    avatarEl.classList.remove('placeholder');
                    avatarEl.style.backgroundImage = `url("${photo}")`;
                } else {
                    avatarEl.classList.remove('has-photo');
                    avatarEl.classList.add('placeholder');
                    avatarEl.style.backgroundImage = '';
                }
            }
        }

        function syncPhotoControls(p) {
            const has = Boolean(String(p?.photo || '').trim());
            if (photoRemoveBtn) photoRemoveBtn.disabled = !has;
        }

        function imageFileToDataUrl(file, { maxDim, quality }) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
                reader.onload = () => {
                    const src = String(reader.result || '');
                    const img = new Image();
                    img.onerror = () => reject(new Error('Gambar tidak valid.'));
                    img.onload = () => {
                        const w = Number(img.naturalWidth || img.width || 0);
                        const h = Number(img.naturalHeight || img.height || 0);
                        if (!w || !h) {
                            reject(new Error('Gambar tidak valid.'));
                            return;
                        }

                        const scale = Math.min(1, (Number(maxDim) || 256) / Math.max(w, h));
                        const tw = Math.max(1, Math.round(w * scale));
                        const th = Math.max(1, Math.round(h * scale));

                        const canvas = document.createElement('canvas');
                        canvas.width = tw;
                        canvas.height = th;

                        const ctx = canvas.getContext('2d', { alpha: false });
                        if (!ctx) {
                            reject(new Error('Browser tidak mendukung canvas.'));
                            return;
                        }

                        ctx.drawImage(img, 0, 0, tw, th);
                        const q = Math.min(0.95, Math.max(0.5, Number(quality) || 0.86));
                        resolve(canvas.toDataURL('image/jpeg', q));
                    };
                    img.src = src;
                };
                reader.readAsDataURL(file);
            });
        }

        function updateThemeDots() {
            if (!dotPrimary || !dotBg || !dotSurface) return;
            const styles = getComputedStyle(document.documentElement);
            dotPrimary.style.background = styles.getPropertyValue('--primary').trim();
            dotBg.style.background = styles.getPropertyValue('--bg').trim();
            dotSurface.style.background = styles.getPropertyValue('--surface').trim();
        }
    }

    function loadProfile() {
        try {
            const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
            if (!raw) return { ...DEFAULT_PROFILE };
            const parsed = JSON.parse(raw);
            return {
                name: String(parsed?.name || DEFAULT_PROFILE.name),
                email: String(parsed?.email || DEFAULT_PROFILE.email),
                role: String(parsed?.role || DEFAULT_PROFILE.role),
                photo: String(parsed?.photo || DEFAULT_PROFILE.photo || ''),
            };
        } catch {
            return { ...DEFAULT_PROFILE };
        }
    }

    function saveProfile(profile) {
        try {
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        } catch {
            // ignore
        }
    }

    function validateProfile(name, email) {
        if (!name) return 'Nama wajib diisi.';
        if (!email) return 'Email wajib diisi.';
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailOk) return 'Format email tidak valid.';
        return '';
    }

    function getInitials(name) {
        const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return 'U';
        const a = parts[0]?.[0] || 'U';
        const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] || '') : '';
        return (a + b).toUpperCase();
    }

    function initDashboard() {
        const kpiProducts = document.getElementById('kpiProducts');
        const kpiSales = document.getElementById('kpiSales');
        const kpiRevenue = document.getElementById('kpiRevenue');
        if (!kpiProducts || !kpiSales || !kpiRevenue) return;

        const totalProducts = state.products.length;
        const totalSales = 85;
        const totalRevenue = 12500000;

        kpiProducts.textContent = totalProducts.toLocaleString('id-ID');
        kpiSales.textContent = totalSales.toLocaleString('id-ID');
        kpiRevenue.textContent = formatCurrency(totalRevenue);

        initThemeControls();
        initDashboardCharts({ totalSales });
    }

    function initDashboardCharts({ totalSales }) {
        const salesCanvas = document.getElementById('chartSales7');
        const stockCanvas = document.getElementById('chartStock');
        if (!(salesCanvas instanceof HTMLCanvasElement) || !(stockCanvas instanceof HTMLCanvasElement)) return;

        const getThemeColors = () => {
            const styles = getComputedStyle(document.documentElement);
            const primary = styles.getPropertyValue('--primary').trim() || '#2563eb';
            const text = styles.getPropertyValue('--text').trim() || '#0f172a';
            const muted = styles.getPropertyValue('--muted').trim() || '#64748b';
            const border = styles.getPropertyValue('--border').trim() || '#e2e8f0';
            const surface = styles.getPropertyValue('--surface').trim() || '#ffffff';
            return { primary, text, muted, border, surface };
        };

        const dayLabels = last7DayLabels();
        const salesSeries = buildSalesSeries(totalSales, dayLabels.length);
        const stockSeries = buildStockSeries(state.products);

        const render = () => {
            const colors = getThemeColors();
            drawLineChart(salesCanvas, {
                labels: dayLabels,
                values: salesSeries,
                colors,
            });
            drawBarChart(stockCanvas, {
                labels: stockSeries.labels,
                values: stockSeries.values,
                colors,
            });
        };

        // initial render
        render();

        // repaint on resize (debounced)
        let resizeTimer = 0;
        window.addEventListener('resize', () => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(render, 120);
        }, { passive: true });

        // repaint on theme change (dark/custom changes data-theme or inline style vars)
        const mo = new MutationObserver(() => render());
        mo.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme', 'style'],
        });

        function last7DayLabels() {
            const fmt = new Intl.DateTimeFormat('id-ID', { weekday: 'short' });
            const out = [];
            const d = new Date();
            for (let i = 6; i >= 0; i--) {
                const dd = new Date(d);
                dd.setDate(d.getDate() - i);
                out.push(fmt.format(dd));
            }
            return out;
        }

        function buildSalesSeries(total, n) {
            const base = Math.max(1, Math.round((Number(total) || 0) / Math.max(1, n)));
            const seed = (state.products.length * 97) + (new Date().getDate() * 13);
            const vals = [];
            for (let i = 0; i < n; i++) {
                const wiggle = pseudoRand01(seed + i * 31) - 0.5; // [-0.5, 0.5]
                const v = Math.max(0, Math.round(base * (1 + wiggle * 0.55)));
                vals.push(v);
            }
            return vals;
        }

        function buildStockSeries(products) {
            const top = [...(products || [])]
                .map(p => ({ name: String(p.name || 'Produk'), stock: Number(p.stock) || 0 }))
                .sort((a, b) => b.stock - a.stock)
                .slice(0, 5);

            const labels = top.length ? top.map(x => x.name) : ['Produk A', 'Produk B', 'Produk C'];
            const values = top.length ? top.map(x => x.stock) : [20, 12, 8];
            return { labels, values };
        }

        function pseudoRand01(x) {
            // deterministic pseudo random [0..1)
            const s = Math.sin(x) * 10000;
            return s - Math.floor(s);
        }

        function setupCanvas(canvas) {
            const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
            const rect = canvas.getBoundingClientRect();
            const cssW = Math.max(1, Math.floor(rect.width));
            const cssH = Math.max(1, Math.floor(rect.height || 220));
            const pxW = Math.floor(cssW * dpr);
            const pxH = Math.floor(cssH * dpr);
            if (canvas.width !== pxW || canvas.height !== pxH) {
                canvas.width = pxW;
                canvas.height = pxH;
            }
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            return { ctx, w: cssW, h: cssH };
        }

        function drawLineChart(canvas, { labels, values, colors }) {
            const s = setupCanvas(canvas);
            if (!s) return;
            const { ctx, w, h } = s;
            ctx.clearRect(0, 0, w, h);

            const padL = 36;
            const padR = 10;
            const padT = 12;
            const padB = 26;
            const cw = Math.max(1, w - padL - padR);
            const ch = Math.max(1, h - padT - padB);

            const maxV = Math.max(1, ...values.map(v => Number(v) || 0));
            const minV = Math.min(...values.map(v => Number(v) || 0));
            const span = Math.max(1, maxV - minV);

            const xAt = (i) => padL + (cw * (values.length === 1 ? 0 : (i / (values.length - 1))));
            const yAt = (v) => padT + ch - (ch * ((v - minV) / span));

            // grid
            ctx.strokeStyle = hexToRgba(colors.border, 0.7) || 'rgba(148,163,184,0.35)';
            ctx.lineWidth = 1;
            for (let k = 0; k <= 3; k++) {
                const y = padT + (ch * (k / 3));
                ctx.beginPath();
                ctx.moveTo(padL, y);
                ctx.lineTo(padL + cw, y);
                ctx.stroke();
            }

            // area fill
            const grad = ctx.createLinearGradient(0, padT, 0, padT + ch);
            grad.addColorStop(0, hexToRgba(colors.primary, 0.22) || 'rgba(37,99,235,0.18)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(xAt(0), yAt(values[0]));
            for (let i = 1; i < values.length; i++) ctx.lineTo(xAt(i), yAt(values[i]));
            ctx.lineTo(xAt(values.length - 1), padT + ch);
            ctx.lineTo(xAt(0), padT + ch);
            ctx.closePath();
            ctx.fill();

            // line
            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(xAt(0), yAt(values[0]));
            for (let i = 1; i < values.length; i++) ctx.lineTo(xAt(i), yAt(values[i]));
            ctx.stroke();

            // points
            for (let i = 0; i < values.length; i++) {
                ctx.fillStyle = colors.surface;
                ctx.beginPath();
                ctx.arc(xAt(i), yAt(values[i]), 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // x labels
            ctx.fillStyle = colors.muted;
            ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            for (let i = 0; i < labels.length; i++) {
                ctx.fillText(String(labels[i] || ''), xAt(i), h - 8);
            }

            // y max label
            ctx.textAlign = 'left';
            ctx.fillText(String(maxV), 10, padT + 10);
        }

        function drawBarChart(canvas, { labels, values, colors }) {
            const s = setupCanvas(canvas);
            if (!s) return;
            const { ctx, w, h } = s;
            ctx.clearRect(0, 0, w, h);

            const padL = 10;
            const padR = 10;
            const padT = 12;
            const padB = 58;
            const cw = Math.max(1, w - padL - padR);
            const ch = Math.max(1, h - padT - padB);

            const maxV = Math.max(1, ...values.map(v => Number(v) || 0));
            const n = Math.max(1, values.length);
            const gap = 10;
            const barW = Math.max(10, Math.floor((cw - gap * (n - 1)) / n));

            // grid baseline
            ctx.strokeStyle = hexToRgba(colors.border, 0.7) || 'rgba(148,163,184,0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padL, padT + ch);
            ctx.lineTo(padL + cw, padT + ch);
            ctx.stroke();

            for (let i = 0; i < n; i++) {
                const v = Number(values[i]) || 0;
                const bh = Math.round((v / maxV) * ch);
                const x = padL + i * (barW + gap);
                const y = padT + ch - bh;

                const r = 10;
                ctx.fillStyle = hexToRgba(colors.primary, 0.22) || 'rgba(37,99,235,0.18)';
                roundRect(ctx, x, y, barW, bh, r);
                ctx.fill();

                ctx.strokeStyle = hexToRgba(colors.primary, 0.7) || colors.primary;
                ctx.lineWidth = 1;
                ctx.stroke();

                // value
                ctx.fillStyle = colors.muted;
                ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial';
                ctx.textAlign = 'center';
                ctx.fillText(String(v), x + barW / 2, y - 6);
            }

            // labels (wrap-ish)
            ctx.fillStyle = colors.muted;
            ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial';
            ctx.textAlign = 'center';
            for (let i = 0; i < n; i++) {
                const x = padL + i * (barW + gap) + barW / 2;
                const label = String(labels[i] || '');
                const short = label.length > 14 ? `${label.slice(0, 12)}…` : label;
                ctx.fillText(short, x, h - 34);
            }
        }

        function roundRect(ctx, x, y, w, h, r) {
            const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
            ctx.beginPath();
            ctx.moveTo(x + rr, y);
            ctx.arcTo(x + w, y, x + w, y + h, rr);
            ctx.arcTo(x + w, y + h, x, y + h, rr);
            ctx.arcTo(x, y + h, x, y, rr);
            ctx.arcTo(x, y, x + w, y, rr);
            ctx.closePath();
        }
    }

    function initProducts() {
        const tbody = document.getElementById('productsTableBody');
        const btnAdd = document.getElementById('btnAddProduct');
        if (!tbody) return;

        const modal = document.getElementById('productModal');
        const modalTitle = document.getElementById('productModalTitle');
        const modalClose = document.getElementById('productModalClose');
        const form = document.getElementById('productForm');
        const btnCancel = document.getElementById('productCancel');
        const nameEl = document.getElementById('productName');
        const priceEl = document.getElementById('productPrice');
        const stockEl = document.getElementById('productStock');
        const formError = document.getElementById('productFormError');

        renderProducts(tbody);

        btnAdd?.addEventListener('click', () => openModal());
        modalClose?.addEventListener('click', closeModal);
        btnCancel?.addEventListener('click', closeModal);

        // close when clicking outside card
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!nameEl || !priceEl || !stockEl) return;

            const name = String(nameEl.value || '').trim();
            const price = toNonNegativeInt(priceEl.value);
            const stock = toNonNegativeInt(stockEl.value);

            const err = validateProduct(name, price, stock);
            if (err) {
                if (formError) showError(formError, err);
                return;
            }
            if (formError) hideError(formError);

            const editId = Number(form?.dataset?.editId || 0);
            if (editId) {
                const existing = state.products.find(p => p.id === editId);
                if (!existing) return;
                existing.name = name;
                existing.price = price;
                existing.stock = stock;
            } else {
                const newId = nextId(state.products);
                state.products.push({ id: newId, name, price, stock });
            }

            saveProducts(state.products);
            renderProducts(tbody);
            closeModal();
        });

        tbody.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;
            const productId = Number(btn.dataset.id);
            const product = state.products.find(p => p.id === productId);
            if (!product) return;

            if (action === 'edit') {
                openModal(product);
                return;
            }

            if (action === 'delete') {
                if (!confirm('Yakin hapus produk ini?')) return;
                state.products = state.products.filter(p => p.id !== productId);
                saveProducts(state.products);
                renderProducts(tbody);
            }
        });

        function openModal(product) {
            if (!modal || !modalTitle || !form || !nameEl || !priceEl || !stockEl) return;
            if (formError) hideError(formError);

            if (product) {
                modalTitle.textContent = 'Edit Produk';
                form.dataset.editId = String(product.id);
                nameEl.value = product.name;
                priceEl.value = String(product.price ?? 0);
                stockEl.value = String(product.stock ?? 0);
            } else {
                modalTitle.textContent = 'Tambah Produk';
                form.dataset.editId = '';
                nameEl.value = '';
                priceEl.value = '';
                stockEl.value = '';
            }

            modal.classList.remove('hidden');
            setTimeout(() => nameEl.focus(), 0);
        }

        function closeModal() {
            if (!modal) return;
            modal.classList.add('hidden');
        }
    }

    function renderProducts(tbody) {
        tbody.innerHTML = '';

        state.products.forEach((p, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td><img src="assets/images/product-placeholder.svg" alt="${escapeHtml(p.name)}" style="width:64px;height:44px;border-radius:10px;object-fit:cover" /></td>
                <td>${escapeHtml(p.name)}</td>
                <td>${formatCurrency(p.price)}</td>
                <td>${Number(p.stock).toLocaleString('id-ID')}</td>
                <td>
                    <div class="cell-actions">
                        <button class="btn small" type="button" data-action="edit" data-id="${p.id}">Edit</button>
                        <button class="btn small danger" type="button" data-action="delete" data-id="${p.id}">Hapus</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function loadProducts() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return DEFAULT_PRODUCTS.slice();
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return DEFAULT_PRODUCTS.slice();
            return parsed
                .map(p => ({
                    id: Number(p.id),
                    name: String(p.name || ''),
                    price: Number(p.price) || 0,
                    stock: Number(p.stock) || 0,
                }))
                .filter(p => Number.isFinite(p.id) && p.id > 0 && p.name.trim());
        } catch {
            return DEFAULT_PRODUCTS.slice();
        }
    }

    function saveProducts(products) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        } catch {
            // ignore write failures (private mode / disabled storage)
        }
    }

    function validateLogin(email, password) {
        if (!email || !password) return 'Email dan password wajib diisi.';
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailOk) return 'Format email tidak valid.';
        return '';
    }

    function showError(el, message) {
        el.textContent = message;
        el.style.display = 'block';
    }

    function hideError(el) {
        el.textContent = '';
        el.style.display = 'none';
    }

    function nextId(products) {
        return products.reduce((maxId, p) => Math.max(maxId, Number(p.id) || 0), 0) + 1;
    }

    function toNonNegativeInt(value) {
        const n = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
        if (!Number.isFinite(n)) return 0;
        return Math.max(0, Math.floor(n));
    }

    function validateProduct(name, price, stock) {
        if (!name) return 'Nama produk wajib diisi.';
        if (price < 0) return 'Harga tidak boleh negatif.';
        if (stock < 0) return 'Stok tidak boleh negatif.';
        return '';
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount) || 0);
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, (c) => (
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
        ));
    }
});