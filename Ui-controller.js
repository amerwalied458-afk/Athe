/**
 * ==========================================================================
 * PROJECT: ATHEER PRO - VIDEO EDITOR ENGINE V12.0
 * DEVELOPER: AMER WALEED (SYSTEM ARCHITECT)
 * MODULE: UI CONTROLLER & EVENT BRIDGE
 * DESCRIPTION: BRIDGING DATA, ENGINE, AND USER INTERFACE
 * ==========================================================================
 */

const UIController = {
    
    // 1. تهيئة المتحكم
    init() {
        this.bindSheets();
        this.renderQuranLibrary();
        this.renderFilterGallery();
        this.renderVoiceOptions();
        this.listenToInputs();
        console.log("✅ UI Controller Active - Connectivity Established.");
    },

    // 2. نظام فتح وإغلاق النوافذ السفلية (Sheets System)
    bindSheets() {
        const overlay = document.getElementById('global-sheet-overlay');
        
        // ربط أزرار الأدوات بفتح النوافذ
        document.querySelectorAll('[data-open-sheet]').forEach(btn => {
            btn.onclick = () => {
                const sheetId = btn.getAttribute('data-open-sheet');
                this.openSheet(sheetId);
            };
        });

        // إغلاق عند الضغط على الأوفرلاي
        overlay.onclick = () => this.closeActiveSheet();
    },

    openSheet(id) {
        // إغلاق أي نافذة مفتوحة أولاً
        this.closeActiveSheet();

        const sheet = document.createElement('div');
        sheet.id = `active-sheet-${id}`;
        sheet.className = 'bottom-sheet-panel is-active';
        
        // جلب المحتوى بناءً على المعرف (ID)
        let contentHtml = this.getSheetTemplate(id);
        
        sheet.innerHTML = `
            <div class="sheet-header-box">
                <span class="sheet-title">${this.getTranslation(id)}</span>
                <button class="btn-close-sheet" onclick="UIController.closeActiveSheet()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="sheet-content-body">
                ${contentHtml}
            </div>
        `;

        document.body.appendChild(sheet);
        document.getElementById('global-sheet-overlay').style.display = 'block';
        
        // تنفيذ الأكواد الخاصة بكل نافذة بعد الحقن
        if(id === 'quran-library') this.renderQuranLibrary();
        if(id === 'visual-effects') this.renderFilterGallery();
        this.listenToInputs(); // إعادة ربط السلايدرز
    },

    closeActiveSheet() {
        const activeSheet = document.querySelector('.bottom-sheet-panel');
        if (activeSheet) {
            activeSheet.classList.remove('is-active');
            setTimeout(() => activeSheet.remove(), 400);
        }
        document.getElementById('global-sheet-overlay').style.display = 'none';
    },

    // 3. قوالب النوافذ المنبثقة (Templates)
    getSheetTemplate(id) {
        const templates = {
            'edit-properties': `
                <div class="control-unit">
                    <div class="unit-label-row"><span>الشفافية</span><span class="unit-val" id="op-val">100%</span></div>
                    <input type="range" class="prop-slider" data-prop="opacity" min="0" max="1" step="0.05" value="1">
                </div>
                <div class="control-unit">
                    <div class="unit-label-row"><span>الحجم (Scale)</span><span class="unit-val" id="sc-val">1.0x</span></div>
                    <input type="range" class="prop-slider" data-prop="scale" min="0.5" max="3" step="0.1" value="1">
                </div>
                <button class="action-strip-btn" onclick="AtheerEngine.applyKenBurns()">
                    <i class="fa-solid fa-expand"></i> تفعيل التحريك السينمائي
                </button>
            `,
            'quran-library': `
                <div id="quran-dynamic-list" class="quran-grid"></div>
            `,
            'ai-voice-engine': `
                <textarea id="ai-text-input" class="ai-textarea" placeholder="اكتب النص القرآني أو الحكمة هنا..."></textarea>
                <div id="voice-options-container" class="mb-6"></div>
                <button class="btn-primary-action w-full justify-center py-4" onclick="UIController.handleAIGeneration()">
                    توليد وإضافة للتايم لاين
                </button>
            `,
            'visual-effects': `
                <div id="filter-gallery" class="grid-options"></div>
            `
        };
        return templates[id] || '<p class="text-center text-gray-500">جاري التطوير...</p>';
    },

    // 4. الرندرة الديناميكية للبيانات (Dynamic Rendering)
    renderQuranLibrary() {
        const list = document.getElementById('quran-dynamic-list');
        if (!list) return;

        // استدعاء البيانات من AtheerData.quranLibrary (الموجود في data.js)
        const fragment = document.createDocumentFragment();
        AtheerData.quranLibrary.forEach(item => {
            const row = document.createElement('div');
            row.className = 'quran-item-row';
            row.innerHTML = `
                <div class="surah-name">سورة ${item.surah}</div>
                <div class="ayah-text">${item.text}</div>
            `;
            row.onclick = () => {
                AtheerEngine.addLayer('text', item.text);
                this.closeActiveSheet();
            };
            fragment.appendChild(row);
        });
        list.appendChild(fragment);
    },

    renderFilterGallery() {
        const gallery = document.getElementById('filter-gallery');
        if (!gallery) return;

        AtheerData.filters.forEach(f => {
            const card = document.createElement('div');
            card.className = 'grid-card';
            card.innerText = f.name;
            card.onclick = () => {
                AtheerEngine.applyFilter(f.css);
                this.closeActiveSheet();
            };
            gallery.appendChild(card);
        });
    },

    renderVoiceOptions() {
        const container = document.getElementById('voice-options-container');
        if (!container) return;

        let html = '<select id="ai-voice-selector" class="custom-select">';
        AtheerData.voicePresets.forEach(v => {
            html += `<option value="${v.id}">${v.name}</option>`;
        });
        html += '</select>';
        container.innerHTML = html;
    },

    // 5. إدارة المدخلات (Input Listeners)
    listenToInputs() {
        document.querySelectorAll('.prop-slider').forEach(slider => {
            slider.oninput = (e) => {
                const prop = e.target.getAttribute('data-prop');
                const val = e.target.value;
                
                // تحديث القيم في المحرك
                AtheerEngine.updateLayerProp(prop, val);

                // تحديث النصوص في الواجهة
                if(prop === 'opacity') document.getElementById('op-val').innerText = `${Math.round(val * 100)}%`;
                if(prop === 'scale') document.getElementById('sc-val').innerText = `${parseFloat(val).toFixed(1)}x`;
            };
        });
    },

    // 6. التعامل مع الذكاء الاصطناعي
    handleAIGeneration() {
        const text = document.getElementById('ai-text-input').value;
        const voiceId = document.getElementById('ai-voice-selector').value;
        
        if (!text.trim()) return alert("الرجاء إدخال النص أولاً");

        const voice = AtheerData.voicePresets.find(v => v.id === voiceId);
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voice.lang;
        utterance.pitch = voice.pitch;
        utterance.rate = voice.rate;
        
        window.speechSynthesis.speak(utterance);
        
        // إضافة طبقة نصية مع الصوت
        AtheerEngine.addLayer('text', text);
        this.closeActiveSheet();
    },

    // ترجمة المعرفات لعناوين الواجهة
    getTranslation(id) {
        const dict = {
            'edit-properties': 'تعديل الخصائص',
            'quran-library': 'المكتبة القرآنية',
            'ai-voice-engine': 'تحويل النص إلى صوت (AI)',
            'visual-effects': 'الفلاتر والمؤثرات البصرية'
        };
        return dict[id] || 'إعدادات';
    }
};

// تشغيل المتحكم
document.addEventListener('DOMContentLoaded', () => UIController.init());
