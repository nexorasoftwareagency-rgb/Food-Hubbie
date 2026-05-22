import { auth, db, uploadImage, ServerValue } from './firebase.js';
import { showToast } from './utils.js';

let currentStep = 1;
let onboardingData = {
    kyc: {}
};

window.showOnboardingFlow = function() {
    document.getElementById('authOverlay').classList.add('hidden');
    document.getElementById('onboardingOverlay').classList.remove('hidden');
    moveOnboard(1);
};

window.hideOnboardingFlow = function() {
    document.getElementById('onboardingOverlay').classList.add('hidden');
    document.getElementById('authOverlay').classList.remove('hidden');
};

window.moveOnboard = function(step) {
    currentStep = step;
    
    // Update Panes
    document.querySelectorAll('.onboard-pane').forEach(p => p.classList.add('hidden'));
    document.getElementById(`onboardStep${step}`).classList.remove('hidden');

    // Update Progress Bar
    const progress = ((step - 1) / 4) * 100;
    document.getElementById('stepProgress').style.width = `${progress}%`;

    // Update Indicators
    for (let i = 1; i <= 5; i++) {
        const el = document.getElementById(`step${i}-indicator`);
        if (!el) continue;
        if (i < step) {
            el.style.background = 'var(--accent)';
            el.style.borderColor = 'var(--accent)';
            el.style.color = 'white';
            el.innerHTML = '<i data-lucide="check" size="14"></i>';
        } else if (i === step) {
            el.style.background = 'var(--bg-card)';
            el.style.borderColor = 'var(--accent)';
            el.style.color = 'var(--accent)';
            el.innerHTML = i;
        } else {
            el.style.background = 'var(--bg-card)';
            el.style.borderColor = 'rgba(255,255,255,0.1)';
            el.style.color = '#94a3b8';
            el.innerHTML = i;
        }
    }
    if (window.lucide) window.lucide.createIcons();
};

window.validateStep1 = function() {
    const email = document.getElementById('obEmail').value.trim();
    const pass = document.getElementById('obPass').value;

    if (!email || !email.includes('@')) return showToast("Valid email required", "error");
    if (pass.length < 6) return showToast("Password must be at least 6 chars", "error");

    onboardingData.email = email;
    onboardingData.password = pass;
    moveOnboard(2);
};

window.validateStep2 = function() {
    const bizName = document.getElementById('obBizName').value.trim();
    const ownerName = document.getElementById('obOwnerName').value.trim();
    const address = document.getElementById('obAddress').value.trim();

    if (!bizName || !ownerName || !address) return showToast("All business details required", "error");

    onboardingData.bizName = bizName;
    onboardingData.ownerName = ownerName;
    onboardingData.address = address;
    moveOnboard(3);
};

window.handleKYCUpload = async function(type, input) {
    const file = input.files[0];
    if (!file) return;

    const statusEl = document.getElementById(`${type}Status`);
    statusEl.innerText = "Uploading...";
    statusEl.className = "text-xs text-accent mt-4 animate-pulse";

    try {
        onboardingData.kyc[type] = await uploadImage(file, `onboarding/kyc/${type}`);
        statusEl.innerText = "Verified Γ£ï";
        statusEl.className = "text-xs text-success mt-4";
        showToast(`${type.toUpperCase()} Uploaded`, "success");
    } catch (err) {
        statusEl.innerText = "Upload Failed";
        statusEl.className = "text-xs text-danger mt-4";
        showToast("KYC Upload Failed", "error");
    }
};

window.validateStep3 = function() {
    if (!onboardingData.kyc.fssai || !onboardingData.kyc.gst) {
        return showToast("Please upload mandatory KYC documents", "warning");
    }
    moveOnboard(4);
};

window.validateStep4 = function() {
    const cuisine = document.getElementById('obCuisine').value;
    const categories = document.getElementById('obCategories').value.trim();

    if (!categories) return showToast("Please define at least one category", "error");

    onboardingData.cuisine = cuisine;
    onboardingData.categories = categories.split(',').map(c => c.trim()).filter(c => c);

    // Populate Summary
    document.getElementById('sumBizName').innerText = onboardingData.bizName;
    document.getElementById('sumOwner').innerText = onboardingData.ownerName;
    document.getElementById('sumEmail').innerText = onboardingData.email;
    document.getElementById('sumCuisine').innerText = onboardingData.cuisine.toUpperCase();
    document.getElementById('sumKyc').innerText = "DOCUMENTS_VERIFIED";
    document.getElementById('sumKyc').className = "text-success";

    moveOnboard(5);
};

window.finalizeOnboarding = async function() {
    const btn = document.getElementById('submitOnboardBtn');
    btn.disabled = true;
    btn.innerHTML = `<span>Provisioning Node...</span>`;

    try {
        // 1. Create Auth Account
        const cred = await auth.createUserWithEmailAndPassword(onboardingData.email, onboardingData.password);
        const uid = cred.user.uid;

        // 2. Register Onboarding Request
        const request = {
            uid: uid,
            email: onboardingData.email,
            bizName: onboardingData.bizName,
            ownerName: onboardingData.ownerName,
            address: onboardingData.address,
            kyc: onboardingData.kyc,
            cuisine: onboardingData.cuisine,
            categories: onboardingData.categories,
            status: 'PENDING',
            submittedAt: ServerValue.TIMESTAMP
        };

        await db.ref(`onboarding_requests/${uid}`).set(request);

        // 3. Success
        showToast("Registration Initialized Successfully", "success");
        document.getElementById('onboardingOverlay').classList.add('hidden');
        document.getElementById('pendingOverlay').classList.remove('hidden');

    } catch (err) {
        console.error(err);
        showToast("Registration Failed: " + err.message, "error");
        btn.disabled = false;
        btn.innerHTML = `<span>Initialize Registration Γ£ï</span>`;
    }
};
