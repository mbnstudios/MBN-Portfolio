// ==========================================
// 1. دوال الواجهة الأساسية والتنقل التلقائي
// ==========================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');
    window.scrollTo(0, 0); 
}

function bookOrder(packageName) {
    const pkgInput = document.getElementById('cust-package');
    if (pkgInput) pkgInput.value = packageName;
    showPage('order');
}

async function adminAccess() {
    if (!supabaseClient) {
        showPage('login-page');
        return;
    }
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        showPage('admin-page');
        fetchOrders();
    } else {
        showPage('login-page');
    }
}

async function handleLogout() {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }
    showPage('home');
}

function closeModal() {
    document.getElementById('success-modal').classList.add('hidden');
    document.getElementById('order-form').reset(); 
    showPage('home'); 
}

// ==========================================
// 2. دوال التحكم بالـ Lightbox والزووم
// ==========================================
function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if(lightbox && lightboxImg) {
        lightbox.style.display = "flex";
        lightboxImg.src = src;
        lightboxImg.classList.remove('zoomed'); 
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if(lightbox) lightbox.style.display = "none";
    if(lightboxImg) lightboxImg.classList.remove('zoomed');
}

function toggleZoom() {
    const img = document.getElementById('lightbox-img');
    if(img) img.classList.toggle('zoomed');
}

// ==========================================
// 3. تهيئة وتأمين الإتصال بقاعدة بيانات Supabase
// ==========================================
let supabaseClient = null;
try {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(
            'https://wgbmcgsvoraioekuygux.supabase.co',
            'sb_publishable_qKPK_MqkYIhGi4PbFd5vhw_nMKWl5UX'
        );
    } else {
        console.warn("Supabase library not loaded yet.");
    }
} catch(err) {
    console.error("Supabase Init Error:", err);
}

// ==========================================
// 4. دالة سحب وعرض الصور من المعارض والـ Storage
// ==========================================
async function openGallery(galleryName) {
    let formattedName = galleryName.replace(/_/g, ' ');
    formattedName = formattedName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    const titleEl = document.getElementById('gallery-title');
    if(titleEl) titleEl.innerText = "Gallery: " + formattedName;
    
    showPage('gallery-view');
    
    const container = document.getElementById('images-container');
    if(!container) return;
    
    if(!supabaseClient) {
        container.innerHTML = "Database Connection Error. Please refresh.";
        return;
    }

    container.innerHTML = "Loading images... ⏳";

    try {
        const { data, error } = await supabaseClient
            .storage
            .from('portfolio_images')
            .list(galleryName, { limit: 100 });

        if (error) throw error;

        container.innerHTML = "";
        
        if(!data || data.length === 0 || (data.length === 1 && data[0].name === '.emptyFolderPlaceholder')){
            container.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #888;'>No images available in this gallery yet.</p>";
            return;
        }

        data.forEach((file) => {
            if (file.name === '.emptyFolderPlaceholder') return;

            const filePath = galleryName + '/' + file.name;
            const { data: urlData } = supabaseClient
                .storage
                .from('portfolio_images')
                .getPublicUrl(filePath);

            const img = document.createElement('img');
            img.src = urlData.publicUrl;
            img.alt = "Portfolio Image";
            img.onclick = () => openLightbox(urlData.publicUrl);
            container.appendChild(img);
        });
    } catch (err) {
        console.error("Gallery Loading Error:", err);
        container.innerHTML = "Error loading images.";
    }
}

// ==========================================
// 5. جلب الطلبات الخاصة بـ لوحة الإدارة
// ==========================================
async function fetchOrders() {
    const tbody = document.querySelector('#admin-table tbody'); 
    if(!tbody || !supabaseClient) return;
    
    tbody.innerHTML = "<tr><td colspan='5'>Loading orders... ⏳</td></tr>";
    
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .order('id', { ascending: false });
            
        if (error) throw error;
        
        tbody.innerHTML = "";
        if (data.length === 0) {
            tbody.innerHTML = "<tr><td colspan='5'>No orders found.</td></tr>";
            return;
        }

        data.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${order.id}</td>
                <td>${order.client_name}</td>
                <td>${order.whatsapp}</td>
                <td>${order.package}</td>
                <td>
                    ${order.file_url ? `<a href="${order.file_url}" target="_blank" style="color: gold; text-decoration: none;">[View Test Img]</a>` : '-'}
                    ${order.drive_link && order.file_url ? ' | ' : ''}
                    ${order.drive_link ? `<a href="${order.drive_link}" target="_blank" style="color: #4CAF50; text-decoration: none;">[Google Drive]</a>` : '-'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(err) {
        tbody.innerHTML = "<tr><td colspan='5'>Error loading admin data.</td></tr>";
    }
}

// ==========================================
// 6. تشغيل ومراقبة الأحداث والفورم عند تحميل الصفحة
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    showPage('home');

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if(lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target !== lightboxImg && e.target !== document.querySelector('.close-btn')) {
                closeLightbox();
            }
        });
    }

    const loginForm = document.getElementById('login-form');
    if(loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if(!supabaseClient) {
                alert("Database connection offline.");
                return;
            }

            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;
            const loginBtn = document.getElementById('login-btn');

            const originalText = loginBtn.innerText;
            loginBtn.innerText = "Signing in... ⏳";
            loginBtn.disabled = true;

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) throw error;

                showPage('admin-page');
                fetchOrders();
                loginForm.reset();

            } catch (error) {
                console.error("Login Error:", error);
                alert("Access Denied: " + error.message);
            } finally {
                loginBtn.innerText = originalText;
                loginBtn.disabled = false;
            }
        });
    }

    const formInputs = [
        document.getElementById('cust-name'),
        document.getElementById('cust-whatsapp'),
        document.getElementById('cust-page')
    ];
    const inputDrive = document.getElementById('cust-drive');
    const inputFile = document.getElementById('cust-file');
    const sendBtn = document.getElementById('send-btn');
    const orderForm = document.getElementById('order-form');

    function checkFormValidity() {
        if(!sendBtn) return;
        const textsFilled = formInputs.every(input => input && input.value.trim() !== '');
        const hasMedia = (inputDrive && inputDrive.value.trim() !== '') || (inputFile && inputFile.files.length > 0);
        sendBtn.disabled = !(textsFilled && hasMedia);
    }

    formInputs.forEach(input => {
        if(input) input.addEventListener('input', checkFormValidity);
    });
    if(inputDrive) inputDrive.addEventListener('input', checkFormValidity);
    if(inputFile) inputFile.addEventListener('change', checkFormValidity);

    if(orderForm) {
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if(!supabaseClient) {
                alert("Database connection error. Try again later.");
                return;
            }

            const originalText = sendBtn.innerText;
            sendBtn.innerText = "Submitting Order... ⏳";
            sendBtn.disabled = true;

            const name = document.getElementById('cust-name').value;
            const whatsapp = document.getElementById('cust-whatsapp').value;
            const pageLink = document.getElementById('cust-page').value;
            const packageSelected = document.getElementById('cust-package').value;
            const driveLink = document.getElementById('cust-drive').value;
            let fileUrl = ""; 

            try {
                if (inputFile && inputFile.files.length > 0) {
                    const file = inputFile.files[0];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
                    const filePath = `test_images/${fileName}`;

                    const { error: uploadError } = await supabaseClient.storage.from('portfolio_images').upload(filePath, file);
                    if (uploadError) throw uploadError;

                    const { data: publicUrlData } = supabaseClient.storage.from('portfolio_images').getPublicUrl(filePath);
                    fileUrl = publicUrlData.publicUrl;
                }

                const { error } = await supabaseClient.from('orders').insert([{
                    client_name: name, whatsapp: whatsapp, page_link: pageLink,
                    package: packageSelected, drive_link: driveLink, file_url: fileUrl
                }]);

                if (error) throw error;
                document.getElementById('success-modal').classList.remove('hidden');

            } catch (error) {
                console.error("Submission Error:", error);
                alert("An error occurred. Please check your data and retry.");
            } finally {
                sendBtn.innerText = originalText;
                checkFormValidity();
            }
        });
    }
});