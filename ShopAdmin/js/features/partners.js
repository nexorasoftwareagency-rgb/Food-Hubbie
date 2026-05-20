import { db, auth, ServerValue, Outlet } from '../firebase.js';
import { showToast, escapeHtml, showConfirm } from '../utils.js';
import { state } from '../state.js';

/**
 * PARTNER MANAGEMENT MODULE
 * Handles the lifecycle of partnership requests from review to automated provisioning.
 */

export function initPartners() {
    cleanupPartners();
    
    const partnersRef = db.ref("onboarding_requests");
    console.log("[Partners] Subscribing to onboarding requests...");

    partnersRef.on("value", snapshot => {
        const data = snapshot.val();
        state.partnerRequests = [];
        
        if (data) {
            Object.keys(data).forEach(id => {
                state.partnerRequests.push({ id, ...data[id] });
            });
            // Sort by date desc
            state.partnerRequests.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }

        renderPartners();
        updatePartnerBadge();
    });
}

export function cleanupPartners() {
    db.ref("onboarding_requests").off();
}

function updatePartnerBadge() {
    const badge = document.getElementById("partner-request-badge");
    const statPending = document.getElementById("partner-stat-pending");
    
    const pendingCount = state.partnerRequests.filter(r => r.status === 'Pending').length;
    
    if (badge) {
        badge.innerText = pendingCount;
        badge.classList.toggle("hidden", pendingCount === 0);
    }
    
    if (statPending) {
        statPending.innerText = `${pendingCount} Pending`;
    }
}

export function renderPartners(searchTerm = "") {
    const table = document.getElementById("partnersTable");
    if (!table) return;

    const query = (searchTerm || "").toLowerCase();
    const filtered = state.partnerRequests.filter(r => {
        const matchesQuery = !query || 
            (r.businessName || "").toLowerCase().includes(query) ||
            (r.ownerName || "").toLowerCase().includes(query) ||
            (r.email || "").toLowerCase().includes(query);
        return matchesQuery;
    });

    if (filtered.length === 0) {
        table.innerHTML = `<tr><td colspan="5" class="text-center p-40 text-muted">No applications found.</td></tr>`;
        return;
    }

    table.innerHTML = filtered.map(r => {
        const statusClass = r.status === 'Approved' ? 'success' : (r.status === 'Rejected' ? 'danger' : 'warning');
        const dateStr = r.timestamp ? new Date(r.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown';
        
        return `
            <tr class="partner-row">
                <td>
                    <div class="flex-col">
                        <span class="font-bold fs-14">${escapeHtml(r.businessName)}</span>
                        <span class="text-muted-small">${escapeHtml(r.cuisine || 'Restaurant')}</span>
                    </div>
                </td>
                <td>
                    <div class="flex-col">
                        <span class="fs-13">${escapeHtml(r.ownerName)}</span>
                        <span class="text-muted-small">${escapeHtml(r.email)}</span>
                    </div>
                </td>
                <td>
                    <div class="flex-row flex-gap-8">
                        ${r.kycAadhar ? `<a href="${r.kycAadhar}" target="_blank" class="chip info pointer">Aadhar</a>` : ''}
                        ${r.kycPan ? `<a href="${r.kycPan}" target="_blank" class="chip warning pointer">PAN</a>` : ''}
                        ${r.kycFssai ? `<a href="${r.kycFssai}" target="_blank" class="chip success pointer">FSSAI</a>` : ''}
                    </div>
                </td>
                <td class="fs-12 text-muted">${dateStr}</td>
                <td class="text-right">
                    ${r.status === 'Pending' ? `
                        <div class="flex-row flex-gap-8 justify-end">
                            <button class="btn-action-v4 small-btn" onclick="approvePartner('${r.id}')" style="background:var(--success); color:white; border:none;">Approve</button>
                            <button class="btn-action-v4 small-btn" onclick="rejectPartner('${r.id}')" style="background:var(--error); color:white; border:none;">Reject</button>
                        </div>
                    ` : `
                        <span class="badge-v4 ${statusClass}">${r.status}</span>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * APPROVE PARTNER
 * Automated provisioning of multi-tenant infrastructure.
 */
window.approvePartner = async function(id) {
    const req = state.partnerRequests.find(r => r.id === id);
    if (!req) return;

    const confirmed = await showConfirm(
        `Approve Partnership?`,
        `This will automatically provision the infrastructure for "${req.businessName}". A welcome notification will be sent to ${req.email}.`,
        "Approve & Provision",
        "Cancel"
    );

    if (!confirmed) return;

    try {
        showToast("Provisioning environment...", "info");

        // 1. Generate IDs
        const businessId = `biz_${req.businessName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
        const outletId = `outlet_main`;

        // 2. Create Business Structure
        const updates = {};
        
        // Business Config
        updates[`businesses/${businessId}/name`] = req.businessName;
        updates[`businesses/${businessId}/owner`] = req.ownerName;
        updates[`businesses/${businessId}/email`] = req.email;
        updates[`businesses/${businessId}/createdAt`] = ServerValue.TIMESTAMP;

        // Main Outlet Provisioning
        const outletPath = `businesses/${businessId}/outlets/${outletId}`;
        updates[`${outletPath}/name`] = `${req.businessName} - Main`;
        updates[`${outletPath}/status`] = "FORCE_CLOSED";
        updates[`${outletPath}/config`] = {
            address: req.address,
            phone: req.phone || "",
            currency: "₹",
            commissionType: "PERCENTAGE",
            commissionValue: 20,
            riderFeeBase: 30,
            riderKmIncentive: 5,
            openTime: "10:00",
            closeTime: "23:00"
        };

        // 3. Register Admin (Link UID if available)
        // Note: The user already created an account during onboarding
        if (req.uid) {
            updates[`admins/${req.uid}`] = {
                businessId: businessId,
                outletId: outletId,
                role: "OWNER",
                email: req.email,
                name: req.ownerName
            };
        }

        // 4. Update Request Status
        updates[`onboarding_requests/${id}/status`] = "Approved";
        updates[`onboarding_requests/${id}/provisionedId`] = businessId;
        updates[`onboarding_requests/${id}/approvedAt`] = ServerValue.TIMESTAMP;

        await db.ref().update(updates);

        showToast("Infrastructure Provisioned Successfully!", "success");
        
        // Optional: Trigger welcome email/whatsapp here
        console.log(`[Partners] Provisioned ${businessId} for ${req.email}`);

    } catch (err) {
        console.error("[Partners] Approval Failed:", err);
        showToast(`Provisioning Error: ${err.message}`, "error");
    }
};

/**
 * REJECT PARTNER
 */
window.rejectPartner = async function(id) {
    const req = state.partnerRequests.find(r => r.id === id);
    if (!req) return;

    const confirmed = await showConfirm(
        `Reject Application?`,
        `Are you sure you want to reject the application from "${req.businessName}"?`,
        "Yes, Reject",
        "Cancel"
    );

    if (!confirmed) return;

    try {
        await db.ref(`onboarding_requests/${id}`).update({
            status: "Rejected",
            rejectedAt: ServerValue.TIMESTAMP
        });
        showToast("Application Rejected", "warning");
    } catch (err) {
        showToast("Action failed", "error");
    }
};
