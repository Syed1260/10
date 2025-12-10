// Completed Orders Management - JavaScript (Firebase Realtime Database)
// UPDATED: Auto-print receipt when marked as "Delivered & Paid" + Manual Print Raseed button for paid orders

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
    console.log("✅ Firebase initialized successfully (completed.js)");
} else {
    console.log("✅ Firebase already initialized (completed.js)");
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
let completedOrders = [];
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
    console.log("🚀 Completed page loaded");
    
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log("✅ User authenticated:", user.email);
            loadCompletedOrders();
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
        const deliveryModal = document.getElementById('deliveryModal');
        const paidModal = document.getElementById('markPaidModal');
        
        if (event.target === deliveryModal) closeModal();
        if (event.target === paidModal) closePaidModal();
    });
}

// Load completed orders from RTDB
function loadCompletedOrders() {
    console.log("📡 Loading completed orders from database...");
    
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
        
        // Filter completed orders
        completedOrders = allOrders.filter(order => order.status === 'Completed');
        console.log(`✅ Found ${completedOrders.length} completed orders`);
        
        updateStats();
        
        // Apply current filter
        let ordersToDisplay = [...completedOrders];
        if (currentFilter === 'paid') {
            ordersToDisplay = completedOrders.filter(order => order.paymentStatus === 'Paid');
        } else if (currentFilter === 'unpaid') {
            ordersToDisplay = completedOrders.filter(order => order.paymentStatus === 'Unpaid');
        }
        displayCompletedOrders(ordersToDisplay);
        
    }, (error) => {
        console.error("❌ Error loading completed orders:", error);
        allOrders = [];
        completedOrders = [];
        updateStats();
        displayCompletedOrders([]);
    });
}

// Update statistics
function updateStats() {
    const totalCompleted = completedOrders.length;
    const totalPaid = completedOrders.filter(order => order.paymentStatus === 'Paid').length;
    const totalUnpaid = completedOrders.filter(order => order.paymentStatus === 'Unpaid').length;
    const pendingAmount = completedOrders
        .filter(order => order.paymentStatus === 'Unpaid')
        .reduce((sum, order) => sum + order.remainingAmount, 0);
    
    document.getElementById('totalCompleted').textContent = totalCompleted;
    document.getElementById('totalPaid').textContent = totalPaid;
    document.getElementById('totalUnpaid').textContent = totalUnpaid;
    document.getElementById('pendingAmount').textContent = `Rs. ${pendingAmount.toFixed(2)}`;
}

// Parse date from DD/MM/YYYY format
function parseDate(dateStr) {
    if (!dateStr) return new Date();
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date();
}

// Display completed orders in table - UPDATED WITH PRINT RASEED BUTTON
function displayCompletedOrders(ordersToDisplay) {
    const tbody = document.getElementById('completedTableBody');
    tbody.innerHTML = '';
    
    if (ordersToDisplay.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11">
                    <div class="empty-state">
                        <div class="empty-state-icon">📦</div>
                        <h3>No Completed Orders</h3>
                        <p>No orders have been completed yet.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by completion date (newest first)
    ordersToDisplay.sort((a, b) => {
        const dateA = a.completionDate ? parseDate(a.completionDate) : 0;
        const dateB = b.completionDate ? parseDate(b.completionDate) : 0;
        return dateB - dateA;
    });
    
    ordersToDisplay.forEach(order => {
        const row = document.createElement('tr');
        
        const paymentStatusClass = order.paymentStatus === 'Paid' ? 'status-paid' : 'status-unpaid';
        const paymentStatusText = order.paymentStatus === 'Paid' ? '✓ Paid' : '⚠ Unpaid';
        
        let actionButtons = `<button class="action-btn btn-view" onclick="viewOrderDetails('${order.orderId}')">View</button>`;
        
        // Show "Print Raseed" button ONLY for PAID orders
        if (order.paymentStatus === 'Paid') {
            actionButtons += `<button class="action-btn btn-print-raseed" onclick="printRaseedManual('${order.orderId}')">🖨️ Print Raseed</button>`;
        }
        
        // Show "Mark Paid" button ONLY for UNPAID orders
        if (order.paymentStatus === 'Unpaid') {
            actionButtons += `<button class="action-btn btn-mark-paid-action" onclick="openMarkPaidModal('${order.orderId}')">Mark Paid</button>`;
        }
        
        actionButtons += `<button class="action-btn btn-deliver" onclick="openDeliveryModal('${order.orderId}')">Deliver</button>`;
        actionButtons += `<button class="action-btn btn-delete" onclick="deleteOrder('${order.orderId}')">Delete</button>`;
        
        row.innerHTML = `
            <td>${order.orderId}</td>
            <td>${order.customerName}</td>
            <td>${order.customerPhone}</td>
            <td>${order.dressType}</td>
            <td><span class="worker-badge">${order.workerName || 'N/A'}</span></td>
            <td>${order.deliveryDate || 'N/A'}</td>
            <td>${order.completionDate || 'N/A'}</td>
            <td>Rs. ${order.totalAmount.toFixed(2)}</td>
            <td>Rs. ${order.remainingAmount.toFixed(2)}</td>
            <td><span class="payment-status ${paymentStatusClass}">${paymentStatusText}</span></td>
            <td>${actionButtons}</td>
        `;
        tbody.appendChild(row);
    });
}

// NEW FUNCTION: Manual Print Raseed for already paid orders
function printRaseedManual(orderId) {
    const order = allOrders.find(o => o.orderId === orderId);
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    if (order.paymentStatus !== 'Paid') {
        alert('⚠️ This order has not been paid yet!');
        return;
    }
    
    console.log("🖨️ Manual print raseed for:", orderId);
    printReceipt(order);
}

// Filter orders
function filterOrders(filterType) {
    currentFilter = filterType;
    
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    let filtered = [...completedOrders];
    
    if (filterType === 'paid') {
        filtered = completedOrders.filter(order => order.paymentStatus === 'Paid');
    } else if (filterType === 'unpaid') {
        filtered = completedOrders.filter(order => order.paymentStatus === 'Unpaid');
    }
    
    displayCompletedOrders(filtered);
}

// Search functionality
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    let filtered = [...completedOrders];
    
    if (currentFilter === 'paid') {
        filtered = filtered.filter(order => order.paymentStatus === 'Paid');
    } else if (currentFilter === 'unpaid') {
        filtered = filtered.filter(order => order.paymentStatus === 'Unpaid');
    }
    
    if (searchTerm !== '') {
        filtered = filtered.filter(order => 
            order.orderId.toLowerCase().includes(searchTerm) ||
            order.customerName.toLowerCase().includes(searchTerm) ||
            order.customerPhone.includes(searchTerm) ||
            order.dressType.toLowerCase().includes(searchTerm) ||
            (order.workerName && order.workerName.toLowerCase().includes(searchTerm))
        );
    }
    
    displayCompletedOrders(filtered);
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
    details += `Status (حالت): ${order.status}\n`;
    details += `Worker (کارکن): ${order.workerName || 'N/A'}\n`;
    details += `Completed On (مکمل ہونے کی تاریخ): ${order.completionDate || 'N/A'}\n`;
    details += `Payment Status (ادائیگی کی حالت): ${order.paymentStatus || 'Unpaid'}\n\n`;
    
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

// Open delivery modal
function openDeliveryModal(orderId) {
    selectedOrderId = orderId;
    const order = allOrders.find(o => o.orderId === orderId);
    
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    document.getElementById('modalOrderId').textContent = order.orderId;
    document.getElementById('modalCustomerName').textContent = order.customerName;
    document.getElementById('modalWorkerName').textContent = order.workerName || 'N/A';
    document.getElementById('modalTotalAmount').textContent = `Rs. ${order.totalAmount.toFixed(2)}`;
    document.getElementById('modalAdvance').textContent = `Rs. ${order.advancePaid.toFixed(2)}`;
    document.getElementById('modalRemaining').textContent = `Rs. ${order.remainingAmount.toFixed(2)}`;
    
    document.getElementById('deliveryNotes').value = '';
    document.getElementById('deliveryModal').style.display = 'block';
}

// Close delivery modal
function closeModal() {
    document.getElementById('deliveryModal').style.display = 'none';
    selectedOrderId = null;
}

// Mark as delivered (paid or unpaid) - UPDATED with auto-print receipt
function markAsDelivered(paymentStatus) {
    if (!selectedOrderId) {
        alert('Error: No order selected!');
        return;
    }
    
    const order = allOrders.find(o => o.orderId === selectedOrderId);
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    const updates = {
        deliveredDate: new Date().toLocaleDateString('en-GB'),
        paymentStatus: paymentStatus === 'paid' ? 'Paid' : 'Unpaid',
    };
    
    if (paymentStatus === 'paid') {
        updates.paidDate = new Date().toLocaleDateString('en-GB');
    }

    const deliveryNotes = document.getElementById('deliveryNotes').value.trim();
    if (deliveryNotes) {
        updates.specialNotes = order.specialNotes 
            ? `${order.specialNotes}\n\nDelivery Notes: ${deliveryNotes}` 
            : `Delivery Notes: ${deliveryNotes}`;
    }

    console.log("💾 Marking order as delivered:", selectedOrderId);

    ordersRef.child(selectedOrderId).update(updates)
        .then(() => {
            console.log("✅ Order marked as delivered successfully");
            closeModal();
            
            // Auto-print receipt if PAID
            if (paymentStatus === 'paid') {
                alert(`✅ Order ${selectedOrderId} marked as Delivered & Paid!\n\nReceipt will open in a new tab for printing.`);
                printReceipt(order);
            } else {
                alert(`✅ Order ${selectedOrderId} marked as Delivered & Unpaid!`);
            }
        })
        .catch(error => {
            console.error("❌ Error updating order status:", error);
            alert('Error updating order status: ' + error.message);
        });
}

// GENERATE AND PRINT RECEIPT IN NEW TAB
function printReceipt(order) {
    console.log("🖨️ Generating receipt for:", order.orderId);
    
    let receiptHTML = generateReceiptHTML(order);
    
    // Open in new tab/window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
        alert('⚠️ Pop-up blocked! Please allow pop-ups to print receipt.');
        return;
    }
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Auto-print after page loads
    printWindow.onload = function() {
        printWindow.print();
    };
}

// GENERATE RECEIPT HTML
function generateReceiptHTML(order) {
    const today = new Date().toLocaleDateString('en-GB');
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Receipt - ${order.orderId}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Courier New', monospace;
                padding: 20px;
                max-width: 80mm;
                margin: 0 auto;
            }
            
            .receipt-header {
                text-align: center;
                border-bottom: 2px dashed #000;
                padding-bottom: 10px;
                margin-bottom: 15px;
            }
            
            .receipt-title {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .receipt-section {
                margin: 12px 0;
                border-bottom: 1px dashed #000;
                padding-bottom: 8px;
            }
            
            .receipt-section:last-of-type {
                border-bottom: none;
            }
            
            .receipt-section-title {
                font-weight: bold;
                text-align: center;
                margin: 8px 0;
                text-decoration: underline;
            }
            
            .receipt-row {
                display: flex;
                justify-content: space-between;
                margin: 3px 0;
                font-size: 13px;
            }
            
            .receipt-label {
                font-weight: bold;
            }
            
            .receipt-footer {
                text-align: center;
                border-top: 2px dashed #000;
                padding-top: 10px;
                margin-top: 15px;
                font-weight: bold;
            }
            
            @media print {
                body {
                    padding: 5mm;
                }
            }
        </style>
    </head>
    <body>
        <div class="receipt-header">
            <div class="receipt-title">AFTAB TAILORS</div>
            <div>Payment Receipt - رسید</div>
            <div style="font-size: 11px; margin-top: 5px;">Date: ${today}</div>
        </div>
        
        <div class="receipt-section">
            <div class="receipt-row">
                <span class="receipt-label">Order ID:</span>
                <span>${order.orderId}</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">Customer:</span>
                <span>${order.customerName}</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">Phone:</span>
                <span>${order.customerPhone}</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">Dress Type:</span>
                <span>${order.dressType}</span>
            </div>
        </div>
        
        <div class="receipt-section">
            <div class="receipt-section-title">PAYMENT DETAILS</div>
            <div class="receipt-row">
                <span class="receipt-label">Total Amount:</span>
                <span>Rs. ${order.totalAmount.toFixed(2)}</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">Advance Paid:</span>
                <span>Rs. ${order.advancePaid.toFixed(2)}</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">Final Payment:</span>
                <span>Rs. ${order.remainingAmount.toFixed(2)}</span>
            </div>
            <div class="receipt-row" style="font-size: 15px; margin-top: 8px; border-top: 1px solid #000; padding-top: 5px;">
                <span class="receipt-label">PAID IN FULL:</span>
                <span style="font-weight: bold;">Rs. ${order.totalAmount.toFixed(2)}</span>
            </div>
        </div>
        
        <div class="receipt-footer">
            Thank you for your business!<br>
            شکریہ
        </div>
    </body>
    </html>
    `;
    
    return html;
}

// Open mark as paid modal
function openMarkPaidModal(orderId) {
    selectedOrderId = orderId;
    const order = allOrders.find(o => o.orderId === orderId);
    
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    document.getElementById('paidModalOrderId').textContent = order.orderId;
    document.getElementById('paidModalCustomerName').textContent = order.customerName;
    document.getElementById('paidModalRemaining').textContent = `Rs. ${order.remainingAmount.toFixed(2)}`;
    
    document.getElementById('paymentNotes').value = '';
    document.getElementById('markPaidModal').style.display = 'block';
}

// Close mark paid modal
function closePaidModal() {
    document.getElementById('markPaidModal').style.display = 'none';
    selectedOrderId = null;
}

// Confirm mark as paid - UPDATED with auto-print receipt
function confirmMarkAsPaid() {
    if (!selectedOrderId) {
        alert('Error: No order selected!');
        return;
    }
    
    const order = allOrders.find(o => o.orderId === selectedOrderId);
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    const updates = {
        paymentStatus: 'Paid',
        paidDate: new Date().toLocaleDateString('en-GB'),
    };
    
    const paymentNotes = document.getElementById('paymentNotes').value.trim();
    if (paymentNotes) {
        updates.specialNotes = order.specialNotes 
            ? `${order.specialNotes}\n\nPayment Notes: ${paymentNotes}` 
            : `Payment Notes: ${paymentNotes}`;
    }
    
    console.log("💾 Marking order as paid:", selectedOrderId);
    
    ordersRef.child(selectedOrderId).update(updates)
        .then(() => {
            console.log("✅ Payment confirmed successfully");
            closePaidModal();
            alert(`✅ Payment received for Order ${selectedOrderId}!\n\nReceipt will open in a new tab for printing.`);
            
            // Auto-print receipt
            printReceipt(order);
        })
        .catch(error => {
            console.error("❌ Error confirming payment:", error);
            alert('Error confirming payment: ' + error.message);
        });
}

// Delete order
function deleteOrder(orderId) {
    const order = allOrders.find(o => o.orderId === orderId);
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    const confirmMsg = `Are you sure you want to delete this completed order?\n\nOrder ID: ${orderId}\nCustomer: ${order.customerName}\nPayment Status: ${order.paymentStatus}\n\nThis action cannot be undone!`;
    
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

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    const deliveryModal = document.getElementById('deliveryModal');
    const paidModal = document.getElementById('markPaidModal');
    
    if (e.key === 'Escape') {
        if (deliveryModal.style.display === 'block') closeModal();
        if (paidModal.style.display === 'block') closePaidModal();
    }
});