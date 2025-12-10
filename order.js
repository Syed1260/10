// Order Management System - JavaScript (Firebase Realtime Database)
// UPDATED: Matches order.html with all 47 fields

// 1. Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMvju-nzd148477cpYTlb-BmPsr9RxEoM",
  authDomain: "tailor-eacde.firebaseapp.com",
  projectId: "tailor-eacde",
  storageBucket: "tailor-eacde.firebasestorage.app",
  messagingSenderId: "1070370733804",
  appId: "1:1070370733804:web:845e93d2ab043e0950efc9"
};

// 2. Initialize Firebase ONLY ONCE
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized successfully (order.js)");
} else {
    console.log("✅ Firebase already initialized (order.js)");
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
let orders = [];
let customers = [];
let editingOrderId = null;

// Database References
const customersRef = db.ref('customers');
const ordersRef = db.ref('orders');

// Field labels matching customer.js (1-47)
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
    console.log("🚀 Order page loaded");
    
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log("✅ User authenticated:", user.email);
            loadCustomersDropdown();
            loadOrders();
            setupEventListeners();
            setOrderDate();
            generateOrderId();
            setMinDeliveryDate();
        } else {
            console.log("❌ No user authenticated, redirecting...");
            window.location.href = 'login.html';
        }
    });
});

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('orderForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('clearBtn').addEventListener('click', clearForm);
    document.getElementById('cancelBtn').addEventListener('click', cancelEdit);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('customerSelect').addEventListener('change', handleCustomerSelect);
    document.getElementById('dressType').addEventListener('change', handleDressTypeChange);
    document.getElementById('stitchingCharges').addEventListener('input', calculateTotal);
    document.getElementById('advancePaid').addEventListener('input', calculateRemaining);
}

// Load customers from RTDB into dropdown
function loadCustomersDropdown() {
    console.log("📡 Loading customers for dropdown...");
    
    customersRef.on('value', (snapshot) => {
        customers = [];
        const select = document.getElementById('customerSelect');
        select.innerHTML = '<option value="">-- Select Customer --</option>';

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const customer = childSnapshot.val();
                customers.push(customer);
                
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = `${customer.name} (${customer.id})`;
                select.appendChild(option);
            });
            console.log(`✅ Loaded ${customers.length} customers`);
        } else {
            console.log("ℹ️ No customers found");
        }
    }, (error) => {
        console.error("❌ Error loading customers:", error);
    });
}

// Load orders from RTDB
function loadOrders() {
    console.log("📡 Loading orders...");
    
    ordersRef.on('value', (snapshot) => {
        orders = [];
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                orders.push(childSnapshot.val());
            });
            console.log(`✅ Loaded ${orders.length} orders`);
        } else {
            console.log("ℹ️ No orders found");
        }
        
        displayOrders(orders);
        generateOrderId();
    }, (error) => {
        console.error("❌ Error loading orders:", error);
        displayOrders([]);
    });
}

// Save order to RTDB
function saveOrderToDatabase(orderData) {
    console.log("💾 Saving order:", orderData.orderId);
    return ordersRef.child(orderData.orderId).set(orderData);
}

// Handle customer selection
function handleCustomerSelect(e) {
    const customerId = e.target.value;
    
    if (!customerId) {
        document.getElementById('customerPhone').value = '';
        document.getElementById('measurementsSection').style.display = 'none';
        return;
    }
    
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    document.getElementById('customerPhone').value = customer.phone;
    
    const dressType = document.getElementById('dressType').value;
    if (dressType === 'Shalwar Kameez') {
        loadCustomerMeasurements(customer);
    }
}

// Handle dress type change
function handleDressTypeChange(e) {
    const dressType = e.target.value;
    const measurementsSection = document.getElementById('measurementsSection');
    
    if (dressType === 'Shalwar Kameez') {
        const customerId = document.getElementById('customerSelect').value;
        if (customerId) {
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                loadCustomerMeasurements(customer);
                measurementsSection.style.display = 'block';
            }
        }
    } else {
        measurementsSection.style.display = 'none';
    }
}

// Load customer measurements (ALL 47 FIELDS)
function loadCustomerMeasurements(customer) {
    console.log("📏 Loading measurements for:", customer.name);
    
    // Fields 1-9 (Qameez & Shalwar measurements)
    document.getElementById('field1').value = customer.qameez?.length || '';
    document.getElementById('field2').value = customer.qameez?.shoulder || '';
    document.getElementById('field3').value = customer.qameez?.sleeve || '';
    document.getElementById('field4').value = customer.qameez?.neck || '';
    document.getElementById('field5').value = customer.qameez?.chest || '';
    document.getElementById('field6').value = customer.qameez?.lowerHip || '';
    document.getElementById('field7').value = customer.qameez?.bottom || '';
    document.getElementById('field8').value = customer.shalwar?.length || '';
    document.getElementById('field9').value = customer.shalwar?.bottom || '';

    // Fields 10-47 (Design details)
    for (let i = 10; i <= 47; i++) {
        const fieldKey = `field${i}`;
        document.getElementById(fieldKey).value = customer.design?.[fieldKey] || '';
    }
    
    document.getElementById('measurementsSection').style.display = 'block';
}

// Generate unique order ID
function generateOrderId() {
    if (editingOrderId) return;
    
    const lastId = orders.length > 0 ? 
        Math.max(...orders.map(o => parseInt(o.orderId.replace('ORD', '')) || 0)) : 0;
    const newId = 'ORD' + String(lastId + 1).padStart(4, '0');
    document.getElementById('orderId').value = newId;
}

// Set current date
function setOrderDate() {
    if (editingOrderId) return;
    
    const today = new Date();
    document.getElementById('orderDate').value = formatDate(today);
}

// Set minimum delivery date
function setMinDeliveryDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('deliveryDate').min = `${yyyy}-${mm}-${dd}`;
}

// Format date to DD/MM/YYYY
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// Calculate total amount
function calculateTotal() {
    const stitching = parseFloat(document.getElementById('stitchingCharges').value) || 0;
    document.getElementById('totalAmount').value = stitching.toFixed(2);
    calculateRemaining();
}

// Calculate remaining amount
function calculateRemaining() {
    const total = parseFloat(document.getElementById('totalAmount').value) || 0;
    const advance = parseFloat(document.getElementById('advancePaid').value) || 0;
    document.getElementById('remainingAmount').value = (total - advance).toFixed(2);
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    console.log("📝 Order form submitted");
    
    const customerId = document.getElementById('customerSelect').value;
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) {
        alert('Please select a customer!');
        return;
    }
    
    const dressType = document.getElementById('dressType').value;
    
    // Base order data
    const orderData = {
        orderId: document.getElementById('orderId').value,
        customerId: customerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        dressType: dressType,
        orderDate: document.getElementById('orderDate').value,
        deliveryDate: formatDate(document.getElementById('deliveryDate').value),
        fabricType: document.getElementById('fabricType').value,
        fabricColor: document.getElementById('fabricColor').value,
        stitchingCharges: parseFloat(document.getElementById('stitchingCharges').value) || 0,
        totalAmount: parseFloat(document.getElementById('totalAmount').value) || 0,
        advancePaid: parseFloat(document.getElementById('advancePaid').value) || 0,
        remainingAmount: parseFloat(document.getElementById('remainingAmount').value) || 0,
        specialNotes: document.getElementById('specialNotes').value.trim(),
        status: 'Pending',
        workerName: '',
        cutterName: '',
        paymentStatus: 'Unpaid'
    };
    
    // Add measurements if Shalwar Kameez
    if (dressType === 'Shalwar Kameez') {
        orderData.measurements = {
            qameez: {
                length: document.getElementById('field1').value || '0',
                shoulder: document.getElementById('field2').value || '0',
                sleeve: document.getElementById('field3').value || '0',
                neck: document.getElementById('field4').value || '0',
                chest: document.getElementById('field5').value || '0',
                lowerHip: document.getElementById('field6').value || '0',
                bottom: document.getElementById('field7').value || '0',
            },
            shalwar: {
                length: document.getElementById('field8').value || '0',
                bottom: document.getElementById('field9').value || '0',
            },
            design: {}
        };
        
        // Fields 10-47 (Design details)
        for (let i = 10; i <= 47; i++) {
            const fieldKey = `field${i}`;
            orderData.measurements.design[fieldKey] = document.getElementById(fieldKey).value || '';
        }
    }
    
    // Save to database
    saveOrderToDatabase(orderData)
        .then(() => {
            console.log("✅ Order saved successfully");
            alert(editingOrderId ? 'Order updated!' : 'Order created successfully!');
            clearForm();
        })
        .catch(error => {
            console.error("❌ Error saving order:", error);
            alert('Error saving order: ' + error.message);
        });
}

// Display orders in table - NO PRINT BUTTON
function displayOrders(ordersToDisplay) {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';
    
    if (ordersToDisplay.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No orders found</td></tr>';
        return;
    }
    
    ordersToDisplay.forEach(order => {
        const row = document.createElement('tr');
        
        let statusClass = 'status-pending';
        if (order.status === 'In Progress') statusClass = 'status-progress';
        if (order.status === 'Completed') statusClass = 'status-completed';
        
        row.innerHTML = `
            <td>${order.orderId}</td>
            <td>${order.customerName}</td>
            <td>${order.customerPhone}</td>
            <td>${order.dressType}</td>
            <td>${order.orderDate}</td>
            <td>${order.deliveryDate}</td>
            <td>Rs. ${order.totalAmount.toFixed(2)}</td>
            <td><span class="status-badge ${statusClass}">${order.status}</span></td>
            <td>
                <button class="action-btn btn-view" onclick="viewOrder('${order.orderId}')">View</button>
                <button class="action-btn btn-edit" onclick="editOrder('${order.orderId}')">Edit</button>
                <button class="action-btn btn-delete" onclick="deleteOrder('${order.orderId}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// View order details - Shows all 47 fields
function viewOrder(orderId) {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;
    
    let details = `ORDER DETAILS:\n\n`;
    details += `Order ID: ${order.orderId}\n`;
    details += `Customer: ${order.customerName}\n`;
    details += `Phone: ${order.customerPhone}\n`;
    details += `Dress Type: ${order.dressType}\n`;
    details += `Order Date: ${order.orderDate}\n`;
    details += `Delivery Date: ${order.deliveryDate}\n`;
    details += `Status: ${order.status}\n\n`;
    
    if (order.measurements) {
        details += `QAMEEZ & SHALWAR MEASUREMENTS:\n`;
        details += `1. ${fieldLabels[0]}: ${order.measurements.qameez.length}"\n`;
        details += `2. ${fieldLabels[1]}: ${order.measurements.qameez.shoulder}"\n`;
        details += `3. ${fieldLabels[2]}: ${order.measurements.qameez.sleeve}"\n`;
        details += `4. ${fieldLabels[3]}: ${order.measurements.qameez.neck}"\n`;
        details += `5. ${fieldLabels[4]}: ${order.measurements.qameez.chest}"\n`;
        details += `6. ${fieldLabels[5]}: ${order.measurements.qameez.lowerHip}"\n`;
        details += `7. ${fieldLabels[6]}: ${order.measurements.qameez.bottom}"\n`;
        details += `8. ${fieldLabels[7]}: ${order.measurements.shalwar.length}"\n`;
        details += `9. ${fieldLabels[8]}: ${order.measurements.shalwar.bottom}"\n\n`;
        
        details += `DESIGN DETAILS:\n`;
        for (let i = 10; i <= 47; i++) {
            const fieldKey = `field${i}`;
            const value = order.measurements.design[fieldKey];
            if (value && value.trim()) {
                details += `${i}. ${fieldLabels[i-1]}: ${value}\n`;
            }
        }
    }
    
    details += `\nFABRIC:\nType: ${order.fabricType || 'N/A'}\nColor: ${order.fabricColor || 'N/A'}\n`;
    details += `\nPRICING:\n`;
    details += `Total: Rs. ${order.totalAmount.toFixed(2)}\n`;
    details += `Advance: Rs. ${order.advancePaid.toFixed(2)}\n`;
    details += `Remaining: Rs. ${order.remainingAmount.toFixed(2)}\n`;
    
    if (order.specialNotes) {
        details += `\nNotes: ${order.specialNotes}`;
    }
    
    alert(details);
}

// Edit order
function editOrder(orderId) {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;
    
    editingOrderId = orderId;
    
    document.getElementById('orderId').value = order.orderId;
    document.getElementById('orderDate').value = order.orderDate;
    
    const parts = order.deliveryDate.split('/');
    if (parts.length === 3) {
        document.getElementById('deliveryDate').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    document.getElementById('customerSelect').value = order.customerId;
    document.getElementById('customerPhone').value = order.customerPhone;
    document.getElementById('dressType').value = order.dressType;
    
    if (order.dressType === 'Shalwar Kameez' && order.measurements) {
        document.getElementById('measurementsSection').style.display = 'block';
        
        // Load measurements (fields 1-9)
        document.getElementById('field1').value = order.measurements.qameez.length;
        document.getElementById('field2').value = order.measurements.qameez.shoulder;
        document.getElementById('field3').value = order.measurements.qameez.sleeve;
        document.getElementById('field4').value = order.measurements.qameez.neck;
        document.getElementById('field5').value = order.measurements.qameez.chest;
        document.getElementById('field6').value = order.measurements.qameez.lowerHip || '0';
        document.getElementById('field7').value = order.measurements.qameez.bottom;
        document.getElementById('field8').value = order.measurements.shalwar.length;
        document.getElementById('field9').value = order.measurements.shalwar.bottom;
        
        // Load design details (fields 10-47)
        for (let i = 10; i <= 47; i++) {
            const fieldKey = `field${i}`;
            document.getElementById(fieldKey).value = order.measurements.design[fieldKey] || '';
        }
    }
    
    document.getElementById('fabricType').value = order.fabricType;
    document.getElementById('fabricColor').value = order.fabricColor;
    document.getElementById('stitchingCharges').value = order.stitchingCharges;
    calculateTotal();
    document.getElementById('advancePaid').value = order.advancePaid;
    calculateRemaining();
    document.getElementById('specialNotes').value = order.specialNotes;
    
    document.getElementById('formTitle').textContent = 'Edit Order';
    document.getElementById('saveBtn').textContent = 'Update Order';
    document.getElementById('cancelBtn').style.display = 'block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Delete order
function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    ordersRef.child(orderId).remove()
        .then(() => {
            console.log("✅ Order deleted");
            alert('Order deleted successfully!');
        })
        .catch(error => {
            console.error("❌ Error deleting:", error);
            alert('Error deleting order: ' + error.message);
        });
}

// Clear form
function clearForm() {
    document.getElementById('orderForm').reset();
    editingOrderId = null;
    document.getElementById('measurementsSection').style.display = 'none';
    document.getElementById('formTitle').textContent = 'Create New Order';
    document.getElementById('saveBtn').textContent = 'Create Order';
    document.getElementById('cancelBtn').style.display = 'none';
    generateOrderId();
    setOrderDate();
    setMinDeliveryDate();
}

// Cancel edit
function cancelEdit() {
    clearForm();
}

// Search functionality
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        displayOrders(orders);
        return;
    }
    
    const filtered = orders.filter(order => 
        order.orderId.toLowerCase().includes(searchTerm) ||
        order.customerName.toLowerCase().includes(searchTerm) ||
        order.customerPhone.includes(searchTerm) ||
        order.dressType.toLowerCase().includes(searchTerm)
    );
    
    displayOrders(filtered);
}