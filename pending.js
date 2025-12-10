// Pending Orders Management - JavaScript (Firebase Realtime Database)
// UPDATED: Print button functionality removed

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
    console.log("✅ Firebase initialized successfully (pending.js)");
} else {
    console.log("✅ Firebase already initialized (pending.js)");
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
let pendingOrders = [];
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
    console.log("🚀 Pending page loaded");
    
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log("✅ User authenticated:", user.email);
            loadPendingOrders();
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
        const modal = document.getElementById('assignWorkerModal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Load pending orders from RTDB
function loadPendingOrders() {
    console.log("📡 Loading pending orders from database...");
    
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
        
        // Filter pending orders
        pendingOrders = allOrders.filter(order => order.status === 'Pending');
        console.log(`📋 Found ${pendingOrders.length} pending orders`);
        
        updateStats();
        
        // Apply current filter
        let ordersToDisplay = [...pendingOrders];
        if (currentFilter === 'urgent') {
            ordersToDisplay = pendingOrders.filter(order => getDaysLeft(order.deliveryDate) <= 3);
        } else if (currentFilter === 'normal') {
            ordersToDisplay = pendingOrders.filter(order => getDaysLeft(order.deliveryDate) > 3);
        }
        displayPendingOrders(ordersToDisplay);
        
    }, (error) => {
        console.error("❌ Error loading pending orders:", error);
        allOrders = [];
        pendingOrders = [];
        updateStats();
        displayPendingOrders([]);
    });
}

// Update statistics
function updateStats() {
    const totalPending = pendingOrders.length;
    const urgentCount = pendingOrders.filter(order => getDaysLeft(order.deliveryDate) <= 3).length;
    const totalAmount = pendingOrders.reduce((sum, order) => sum + order.remainingAmount, 0);
    
    document.getElementById('totalPending').textContent = totalPending;
    document.getElementById('urgentOrders').textContent = urgentCount;
    document.getElementById('totalPendingAmount').textContent = `Rs. ${totalAmount.toFixed(2)}`;
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

// Display pending orders in table
function displayPendingOrders(ordersToDisplay) {
    const tbody = document.getElementById('pendingOrdersTableBody');
    tbody.innerHTML = '';
    
    if (ordersToDisplay.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        <div class="empty-state-icon">🎉</div>
                        <h3>No Pending Orders</h3>
                        <p>All orders have been assigned or there are no pending orders.</p>
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
            <td>${order.orderDate}</td>
            <td>${order.deliveryDate}</td>
            <td>${getDaysLeftBadge(order.deliveryDate)}</td>
            <td>Rs. ${order.totalAmount.toFixed(2)}</td>
            <td>
                <button class="action-btn btn-view" onclick="viewOrderDetails('${order.orderId}')">View</button>
                <button class="action-btn btn-start" onclick="openAssignModal('${order.orderId}')">Start Work</button>
                <button class="action-btn btn-delete" onclick="deleteOrder('${order.orderId}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Filter orders
function filterOrders(filterType) {
    currentFilter = filterType;
    
    // Update active button
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    let filtered = [...pendingOrders];
    
    if (filterType === 'urgent') {
        filtered = pendingOrders.filter(order => getDaysLeft(order.deliveryDate) <= 3);
    } else if (filterType === 'normal') {
        filtered = pendingOrders.filter(order => getDaysLeft(order.deliveryDate) > 3);
    }
    
    displayPendingOrders(filtered);
}

// Search functionality
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    let filtered = [...pendingOrders];
    
    // Apply existing filter first
    if (currentFilter === 'urgent') {
        filtered = filtered.filter(order => getDaysLeft(order.deliveryDate) <= 3);
    } else if (currentFilter === 'normal') {
        filtered = filtered.filter(order => getDaysLeft(order.deliveryDate) > 3);
    }
    
    // Apply search
    if (searchTerm !== '') {
        filtered = filtered.filter(order => 
            order.orderId.toLowerCase().includes(searchTerm) ||
            order.customerName.toLowerCase().includes(searchTerm) ||
            order.customerPhone.includes(searchTerm) ||
            order.dressType.toLowerCase().includes(searchTerm)
        );
    }
    
    displayPendingOrders(filtered);
}

// View order details - UPDATED to show all 47 fields properly
function viewOrderDetails(orderId) {
    const order = allOrders.find(o => o.orderId === orderId);
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    let details = `ORDER DETAILS (آرڈر کی تفصیلات):\n\n`;
    details += `Order ID (کوڈ): ${order.orderId}\n`;
    details += `Customer (گاہک): ${order.customerName}\n`;
    details += `Phone (فون): ${order.customerPhone}\n`;
    details += `Dress Type (لباس کی قسم): ${order.dressType}\n`;
    details += `Order Date (تاریخ): ${order.orderDate}\n`;
    details += `Delivery Date (ترسیل): ${order.deliveryDate}\n`;
    details += `Days Left (دن باقی): ${getDaysLeft(order.deliveryDate)} days\n`;
    details += `Status (حالت): ${order.status}\n\n`;
    
    // Only show measurements if they exist
    if (order.measurements) {
        details += `QAMEEZ MEASUREMENTS (قمیض کی پیمائش):\n`;
        details += `1. ${fieldLabels[0]}: ${order.measurements.qameez.length || 'N/A'}"\n`;
        details += `2. ${fieldLabels[1]}: ${order.measurements.qameez.shoulder || 'N/A'}"\n`;
        details += `3. ${fieldLabels[2]}: ${order.measurements.qameez.sleeve || 'N/A'}"\n`;
        details += `4. ${fieldLabels[3]}: ${order.measurements.qameez.neck || 'N/A'}"\n`;
        details += `5. ${fieldLabels[4]}: ${order.measurements.qameez.chest || 'N/A'}"\n`;
        details += `6. ${fieldLabels[5]}: ${order.measurements.qameez.lowerHip || 'N/A'}"\n`;
        details += `7. ${fieldLabels[6]}: ${order.measurements.qameez.bottom || 'N/A'}"\n\n`;
        
        details += `SHALWAR MEASUREMENTS (شلوار کی پیمائش):\n`;
        details += `8. ${fieldLabels[7]}: ${order.measurements.shalwar.length || 'N/A'}"\n`;
        details += `9. ${fieldLabels[8]}: ${order.measurements.shalwar.bottom || 'N/A'}"\n\n`;
        
        // Show design details (fields 10-47) - only if they have values
        let hasDesignDetails = false;
        let designDetails = `DESIGN & STYLE DETAILS (ڈیزائن اور سٹائل):\n`;
        
        for (let i = 10; i <= 47; i++) {
            const fieldKey = `field${i}`;
            const value = order.measurements.design?.[fieldKey];
            if (value && value.trim() !== '' && value !== '0') {
                designDetails += `${i}. ${fieldLabels[i-1]}: ${value}\n`;
                hasDesignDetails = true;
            }
        }
        
        if (hasDesignDetails) {
            details += designDetails + '\n';
        }
    }
    
    details += `FABRIC (کپڑے کی تفصیلات):\n`;
    details += `Type (قسم): ${order.fabricType || 'N/A'}\n`;
    details += `Color (رنگ): ${order.fabricColor || 'N/A'}\n\n`;
    
    details += `PRICING (قیمت):\n`;
    details += `Total Amount (کل رقم): Rs. ${order.totalAmount.toFixed(2)}\n`;
    details += `Advance Paid (پیشگی ادائیگی): Rs. ${order.advancePaid.toFixed(2)}\n`;
    details += `Remaining (بقیہ): Rs. ${order.remainingAmount.toFixed(2)}\n\n`;
    
    if (order.specialNotes) {
        details += `Notes (ہدایات): ${order.specialNotes}`;
    }
    
    alert(details);
}

// Open assign worker modal
function openAssignModal(orderId) {
    selectedOrderId = orderId;
    const order = allOrders.find(o => o.orderId === orderId);
    
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    document.getElementById('modalOrderId').textContent = order.orderId;
    document.getElementById('modalCustomerName').textContent = order.customerName;
    document.getElementById('modalDressType').textContent = order.dressType;
    document.getElementById('modalDeliveryDate').textContent = order.deliveryDate;
    
    document.getElementById('cutterName').value = '';
    document.getElementById('workerName').value = '';
    
    document.getElementById('assignWorkerModal').style.display = 'block';
    document.getElementById('cutterName').focus();
}

// Close modal
function closeModal() {
    document.getElementById('assignWorkerModal').style.display = 'none';
    selectedOrderId = null;
}

// Assign worker and move to In Progress
function assignWorkerAndStart() {
    const cutterName = document.getElementById('cutterName').value.trim();
    const workerName = document.getElementById('workerName').value.trim();
    
    if (!cutterName) {
        alert('Please enter cutter name!');
        document.getElementById('cutterName').focus();
        return;
    }
    
    if (!workerName) {
        alert('Please enter worker name!');
        document.getElementById('workerName').focus();
        return;
    }
    
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
        status: 'In Progress',
        cutterName: cutterName,
        workerName: workerName,
        workStartDate: new Date().toLocaleDateString('en-GB')
    };
    
    console.log("💾 Assigning worker and updating order:", selectedOrderId);
    
    // Update in Firebase
    ordersRef.child(selectedOrderId).update(updates)
        .then(() => {
            console.log("✅ Order status updated successfully");
            closeModal();
            alert(`✅ Order ${selectedOrderId} assigned!\n\nCutter: ${cutterName}\nWorker: ${workerName}\n\nStatus changed to "In Progress"\n\nYou can now print the worker slip from the In Progress page.`);
        })
        .catch(error => {
            console.error("❌ Error updating order:", error);
            alert('Error updating order status: ' + error.message);
        });
}

// Delete order
function deleteOrder(orderId) {
    const order = allOrders.find(o => o.orderId === orderId);
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    const confirmMsg = `Are you sure you want to delete this order?\n\nOrder ID: ${orderId}\nCustomer: ${order.customerName}\n\nThis action cannot be undone!`;
    
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
    const modal = document.getElementById('assignWorkerModal');
    
    if (modal.style.display === 'block') {
        if (e.key === 'Escape') {
            closeModal();
        }
        
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            assignWorkerAndStart();
        }
    }
});