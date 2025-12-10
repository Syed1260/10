// In Progress Orders Management - JavaScript with ENHANCED Print Worker Slip
// UPDATED: Shows ALL 47 fields, measurements, designs, worker & cutter names
// UPDATED: Pricing section removed from print slip

// 1. Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMvju-nzd148477cpYTlb-BmPsr9RxEoM",
  authDomain: "tailor-eacde.firebaseapp.com",
  projectId: "tailor-eacde",
  storageBucket: "tailor-eacde.firebasestorage.app",
  messagingSenderId: "1070370733804",
  appId: "1:1070370733804:web:845e93d2ab043e0950efc9"
};

// 2. Initialize Firebase ONLY ONCE (with error handling)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized successfully (inprogress.js)");
} else {
    console.log("✅ Firebase already initialized (inprogress.js)");
}

const db = firebase.database();
const auth = firebase.auth();

// Logout function
function logout() {
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error("Logout error:", error);
    });
}

// Global Variables
let allOrders = [];
let inProgressOrders = [];
let currentFilter = 'all';
let selectedOrderId = null;

// Database Reference
const ordersRef = db.ref('orders');

// Field labels matching customer.js (fields 1-47)
const fieldLabels = [
    'قمیض (Kameez/Shirt Length)',
    'تیرہ (Shoulder/Back Width)',
    'آستین (Sleeve Length)',
    'گلا (Neck)',
    'چهاتی (Chest)',
    'چھوڑائی (Lower Hip/Flare)',
    'دامن (Hem/Bottom Width)',
    'شلوار (Shalwar/Trousers Length)',
    'پانچہ (Trouser Cuff/Ankle)',
    'کالر (Collar)',
    'باف بین گول (Double Cuff Round)',
    'باف بین چورس (Double Cuff Square)',
    'شیروانی (Sherwani Style)',
    'سامنے جیب (Front Pocket)',
    'سائیڈ جیب (Side Pocket)',
    'کف گول (Cuff Round)',
    'کف چورس (Cuff Square)',
    'کف کونا کاٹ (Cuff Corner Cut)',
    'اسٹڈ کف (Stud Cuff)',
    'سادہ بازوں بکرم (Simple Sleeves w/ Interlining)',
    'سادہ بازوں کنی (Simple Sleeves cuff/key)',
    'پٹی سائز (Patti Size)',
    'سادہ پٹی (Simple Placket)',
    'پٹی کاج (Placket Buttonhole)',
    'موڑا (Mora)',
    'شلوار 6 درز (Shalwar 6 folds/darts)',
    'شلوار 2 درز (Shalwar 2 folds/darts)',
    'شلوار فٹ (Shalwar Fit)',
    'دامن گول',
    'دامن چورس',
    'کف پلیٹ',
    'لیبل',
    'چاک پٹی فٹ',
    'چاک پٹی کاج',
    'کف ڈبل کاج',
    'اسٹڈ کاج',
    'سادہ سلائی',
    'ڈبل سلائی',
    'سلائی چمکدار',
    'بٹن میٹل',
    'شلوار جیب',
    'اندر جیب',
    'کالر فرینچ',
    'کالر گول نوک',
    'رنگ بٹن',
    'سپرٹ پٹائی',
    'فینسی بٹن'
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 In Progress page loaded");
    
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log("✅ User authenticated:", user.email);
            loadInProgressOrders();
            setupEventListeners();
        } else {
            console.log("❌ No user authenticated, redirecting to login...");
            window.location.href = 'login.html';
        }
    });
});

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('completeOrderModal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Load in progress orders from RTDB
function loadInProgressOrders() {
    console.log("📡 Loading in progress orders from database...");
    
    ordersRef.on('value', (snapshot) => {
        allOrders = [];
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                allOrders.push(childSnapshot.val());
            });
            console.log(`✅ Loaded ${allOrders.length} total orders`);
        } else {
            console.log("ℹ️ No orders found in database");
        }
        
        // Filter in progress orders
        inProgressOrders = allOrders.filter(order => order.status === 'In Progress');
        console.log(`🔄 Found ${inProgressOrders.length} in progress orders`);
        
        updateStats();
        
        // Apply current filter
        let ordersToDisplay = [...inProgressOrders];
        if (currentFilter === 'urgent') {
            ordersToDisplay = inProgressOrders.filter(order => getDaysLeft(order.deliveryDate) <= 3);
        } else if (currentFilter === 'normal') {
            ordersToDisplay = inProgressOrders.filter(order => getDaysLeft(order.deliveryDate) > 3);
        }
        displayInProgressOrders(ordersToDisplay);
        
    }, (error) => {
        console.error("❌ Error loading in progress orders:", error);
        allOrders = [];
        inProgressOrders = [];
        updateStats();
        displayInProgressOrders([]);
    });
}

// Update statistics
function updateStats() {
    const totalInProgress = inProgressOrders.length;
    
    // Count unique workers
    const uniqueWorkers = new Set(inProgressOrders.map(order => order.workerName).filter(name => name));
    const activeWorkers = uniqueWorkers.size;
    
    const urgentCount = inProgressOrders.filter(order => getDaysLeft(order.deliveryDate) <= 3).length;
    
    document.getElementById('totalInProgress').textContent = totalInProgress;
    document.getElementById('activeWorkers').textContent = activeWorkers;
    document.getElementById('urgentInProgress').textContent = urgentCount;
}

// Calculate days left until delivery
function getDaysLeft(deliveryDate) {
    if (!deliveryDate) return 999;
    
    const parts = deliveryDate.split('/');
    if (parts.length !== 3) return 999;
    
    const delivery = new Date(parts[2], parts[1] - 1, parts[0]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = delivery - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Get days left badge with styling
function getDaysLeftBadge(deliveryDate) {
    const daysLeft = getDaysLeft(deliveryDate);
    let badgeClass = 'days-normal';
    let text = `${daysLeft} days`;
    
    if (daysLeft < 0) {
        badgeClass = 'days-urgent';
        text = `OVERDUE by ${Math.abs(daysLeft)} days`;
    } else if (daysLeft === 0) {
        badgeClass = 'days-urgent';
        text = 'TODAY';
    } else if (daysLeft === 1) {
        badgeClass = 'days-urgent';
        text = 'TOMORROW';
    } else if (daysLeft <= 3) {
        badgeClass = 'days-urgent';
        text = `${daysLeft} days (URGENT)`;
    } else if (daysLeft <= 7) {
        badgeClass = 'days-warning';
    }
    
    return `<span class="days-left ${badgeClass}">${text}</span>`;
}

// Display in progress orders in table
function displayInProgressOrders(ordersToDisplay) {
    const tbody = document.getElementById('inProgressTableBody');
    tbody.innerHTML = '';
    
    if (ordersToDisplay.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <h3>No Orders In Progress</h3>
                        <p>All work is completed or no orders have been started yet.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by delivery date (urgent first)
    ordersToDisplay.sort((a, b) => getDaysLeft(a.deliveryDate) - getDaysLeft(b.deliveryDate));
    
    ordersToDisplay.forEach(order => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${order.orderId}</td>
            <td>${order.customerName}</td>
            <td>${order.customerPhone}</td>
            <td>${order.dressType}</td>
            <td><span class="worker-badge">${order.workerName || 'N/A'}</span></td>
            <td><span class="worker-badge">${order.cutterName || 'N/A'}</span></td>
            <td>${order.workStartDate || 'N/A'}</td>
            <td>${order.deliveryDate}</td>
            <td>${getDaysLeftBadge(order.deliveryDate)}</td>
            <td>
                <button class="action-btn btn-view" onclick="viewOrderDetails('${order.orderId}')">View</button>
                <button class="action-btn btn-print" onclick="printWorkerSlip('${order.orderId}')">Print</button>
                <button class="action-btn btn-complete-action" onclick="openCompleteModal('${order.orderId}')">Complete</button>
                <button class="action-btn btn-delete" onclick="deleteOrder('${order.orderId}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ENHANCED Print Worker Slip - Shows ALL Details including 47 fields, worker & cutter (NO PRICING)
// ENHANCED Print Worker Slip - Matches sample format with BOLD text and BOXES
function printWorkerSlip(orderId) {
    const order = allOrders.find(o => o.orderId === orderId);
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    console.log("🖨️ Printing enhanced worker slip for order:", orderId);
    
    let slipContent = `
        <div class="slip-header">
            <div class="slip-title">AFTAB TAILORS</div>
            <div class="slip-subtitle">Worker Slip - پرچی</div>
            <div style="font-size: 9px; margin-top: 2px;">${new Date().toLocaleDateString('en-GB')}</div>
        </div>
        
        <div class="slip-basic-info">
            <div class="slip-info-row">
                <span class="slip-info-label">Order ID:</span>
                <span class="slip-info-value">${order.orderId}</span>
            </div>
            <div class="slip-info-row">
                <span class="slip-info-label">Customer:</span>
                <span class="slip-info-value">${order.customerName}</span>
            </div>
            <div class="slip-info-row">
                <span class="slip-info-label">Phone:</span>
                <span class="slip-info-value">${order.customerPhone}</span>
            </div>
            <div class="slip-info-row">
                <span class="slip-info-label">Dress:</span>
                <span class="slip-info-value">${order.dressType}</span>
            </div>
            <div class="slip-info-row">
                <span class="slip-info-label">Delivery:</span>
                <span class="slip-info-value">${order.deliveryDate}</span>
            </div>
        </div>
        
        <div class="worker-cutter-box">
            <div class="worker-cutter-row">👷 WORKER: ${order.workerName || 'N/A'}</div>
            <div class="worker-cutter-row">✂️ CUTTER: ${order.cutterName || 'N/A'}</div>
        </div>
    `;
    
    // Add measurements if available
    if (order.measurements && order.measurements.qameez) {
        console.log("✅ Measurements found, adding to slip");
        
        // QAMEEZ & SHALWAR MEASUREMENTS (Fields 1-9) in TWO COLUMNS
        slipContent += `
            <div class="measurements-section">
                <div class="measurements-title">قمیض و شلوار - MEASUREMENTS</div>
                <div class="measurements-grid">
                    <div class="measurement-box">
                        <span class="measurement-label">1. قمیض</span>
                        <span class="measurement-value">${order.measurements.qameez.length || '0'}"</span>
                    </div>
                    <div class="measurement-box">
                        <span class="measurement-label">2. تیرہ</span>
                        <span class="measurement-value">${order.measurements.qameez.shoulder || '0'}"</span>
                    </div>
                    <div class="measurement-box">
                        <span class="measurement-label">3. آستین</span>
                        <span class="measurement-value">${order.measurements.qameez.sleeve || '0'}"</span>
                    </div>
                    <div class="measurement-box">
                        <span class="measurement-label">4. گلا</span>
                        <span class="measurement-value">${order.measurements.qameez.neck || '0'}"</span>
                    </div>
                    <div class="measurement-box">
                        <span class="measurement-label">5. چهاتی</span>
                        <span class="measurement-value">${order.measurements.qameez.chest || '0'}"</span>
                    </div>
                    <div class="measurement-box">
                        <span class="measurement-label">6. چھوڑائی</span>
                        <span class="measurement-value">${order.measurements.qameez.lowerHip || '0'}"</span>
                    </div>
                    <div class="measurement-box">
                        <span class="measurement-label">7. دامن</span>
                        <span class="measurement-value">${order.measurements.qameez.bottom || '0'}"</span>
                    </div>
                    <div class="measurement-box">
                        <span class="measurement-label">8. شلوار</span>
                        <span class="measurement-value">${order.measurements.shalwar.length || '0'}"</span>
                    </div>
                    <div class="measurement-box">
                        <span class="measurement-label">9. پانچہ</span>
                        <span class="measurement-value">${order.measurements.shalwar.bottom || '0'}"</span>
                    </div>
                </div>
            </div>
        `;
        
        // DESIGN DETAILS (Fields 10-47) - Show only fields with values
        let designItems = '';
        let hasDesign = false;
        
        for (let i = 10; i <= 47; i++) {
            const fieldKey = `field${i}`;
            const value = order.measurements.design?.[fieldKey];
            if (value && value.trim() !== '' && value !== '0') {
                hasDesign = true;
                const label = fieldLabels[i-1].split('(')[0].trim(); // Get short label
                designItems += `
                    <div class="design-item">
                        <span class="design-item-label">${i}. ${label}</span>
                        <span class="design-item-value">${value}</span>
                    </div>
                `;
            }
        }
        
        if (hasDesign) {
            console.log("✅ Design details found, adding to slip");
            slipContent += `
                <div class="design-section">
                    <div class="design-title">ڈیزائن - DESIGN DETAILS</div>
                    <div class="design-grid">
                        ${designItems}
                    </div>
                </div>
            `;
        }
    } else {
        console.log("⚠️ No measurements found for this order");
    }
    
    // Add fabric details
    slipContent += `
        <div class="fabric-section">
            <div class="fabric-title">کپڑا - FABRIC</div>
            <div class="fabric-row">
                <span style="font-weight: bold;">Type:</span>
                <span>${order.fabricType || 'N/A'}</span>
            </div>
            <div class="fabric-row">
                <span style="font-weight: bold;">Color:</span>
                <span>${order.fabricColor || 'N/A'}</span>
            </div>
        </div>
    `;
    
    // Add special notes if available
    if (order.specialNotes && order.specialNotes.trim() !== '') {
        slipContent += `
            <div class="notes-section">
                <div class="notes-title">ہدایات - NOTES</div>
                <div class="notes-content">${order.specialNotes}</div>
            </div>
        `;
    }
    
    // Add footer
    slipContent += `
        <div class="slip-footer">
            Quality Work Required - معیاری کام ضروری
        </div>
    `;
    
    const printDiv = document.getElementById('printWorkerSlip');
    printDiv.innerHTML = slipContent;
    printDiv.style.display = 'block';
    
    console.log("🖨️ Opening print dialog...");
    
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            printDiv.style.display = 'none';
            console.log("✅ Print completed");
        }, 100);
    }, 100);
}

// Open complete order modal
function openCompleteModal(orderId) {
    selectedOrderId = orderId;
    const order = allOrders.find(o => o.orderId === orderId);
    
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    document.getElementById('modalOrderId').textContent = order.orderId;
    document.getElementById('modalCustomerName').textContent = order.customerName;
    document.getElementById('modalWorkerName').textContent = order.workerName || 'N/A';
    document.getElementById('modalCutterName').textContent = order.cutterName || 'N/A';
    document.getElementById('modalDressType').textContent = order.dressType;
    document.getElementById('modalDeliveryDate').textContent = order.deliveryDate;
    
    document.getElementById('completeOrderModal').style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('completeOrderModal').style.display = 'none';
    selectedOrderId = null;
}

// Mark order as completed
function markAsCompleted() {
    if (!selectedOrderId) {
        alert('No order selected!');
        return;
    }
    
    const order = allOrders.find(o => o.orderId === selectedOrderId);
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    // Prepare update data
    const updates = {
        status: 'Completed',
        completionDate: new Date().toLocaleDateString('en-GB'),
        paymentStatus: 'Unpaid'
    };
    
    console.log("💾 Marking order as completed:", selectedOrderId);
    
    // Update in Firebase
    ordersRef.child(selectedOrderId).update(updates)
        .then(() => {
            console.log("✅ Order marked as completed successfully");
            closeModal();
            alert(`🎉 CONGRATULATIONS! 🎉\n\nOrder ${selectedOrderId} Completed Successfully!\n\nThe order has been moved to Completed page.\nCustomer can now collect and make payment.`);
        })
        .catch(error => {
            console.error("❌ Error marking order as completed:", error);
            alert('Error marking order as completed: ' + error.message);
        });
}

// Delete order
function deleteOrder(orderId) {
    const order = allOrders.find(o => o.orderId === orderId);
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    const confirmMsg = `Are you sure you want to delete this order?\n\nOrder ID: ${orderId}\nCustomer: ${order.customerName}\nWorker: ${order.workerName}\n\nThis action cannot be undone!`;
    
    if (!confirm(confirmMsg)) return;
    
    console.log("🗑️ Deleting order:", orderId);
    
    ordersRef.child(orderId).remove()
        .then(() => {
            console.log("✅ Order deleted successfully");
            alert('Order deleted successfully!');
        })
        .catch(error => {
            console.error("❌ Error deleting order:", error);
            alert('Error deleting order: ' + error.message);
        });
}

// Keyboard shortcuts for modal
document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('completeOrderModal');
    
    if (modal.style.display === 'block') {
        if (e.key === 'Escape') {
            closeModal();
        }
        
        if (e.key === 'Enter') {
            e.preventDefault();
            markAsCompleted();
        }
    }
});
