// Sales Record Management - JavaScript (Firebase Realtime Database)
// UPDATED: Added Top Workers & Top Cutters breakdown

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
    console.log("✅ Firebase initialized successfully (sales.js)");
} else {
    console.log("✅ Firebase already initialized (sales.js)");
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
let filteredOrders = [];
let currentPeriod = 'all';

// Database Reference
const ordersRef = db.ref('orders');

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 Sales page loaded");
    
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log("✅ User authenticated:", user.email);
            loadAllOrders();
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
}

// Reload data from RTDB
function reloadData() {
    console.log("🔄 Refreshing data from database...");
    loadAllOrders();
    alert('✅ Data refreshed successfully!');
}

// Load all orders from RTDB with real-time sync
function loadAllOrders() {
    console.log("📡 Loading all orders from database...");
    
    // Real-time listener - updates automatically when data changes
    ordersRef.on('value', (snapshot) => {
        allOrders = [];
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                allOrders.push(childSnapshot.val());
            });
            console.log(`✅ Loaded ${allOrders.length} orders from database`);
        } else {
            console.log("ℹ️ No orders found in database");
        }
        
        // After loading, apply current filter
        filterByPeriod(currentPeriod);
        
    }, (error) => {
        console.error("❌ Error loading orders:", error);
        allOrders = [];
        filterByPeriod(currentPeriod);
    });
}

// Parse date from DD/MM/YYYY format
function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return null;
}

// Get date range for period
function getDateRange(period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate, endDate;
    
    switch(period) {
        case 'today':
            startDate = new Date(today);
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            break;
            
        case 'week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - today.getDay());
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
            
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
            
        case 'year':
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear(), 11, 31);
            endDate.setHours(23, 59, 59, 999);
            break;
            
        case 'all':
            startDate = new Date(2000, 0, 1);
            endDate = new Date(2099, 11, 31);
            break;
            
        default:
            startDate = new Date(today);
            endDate = new Date(today);
    }
    
    return { startDate, endDate };
}

// Filter orders by period
function filterByPeriod(period) {
    currentPeriod = period;
    
    // Update active button
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Find and activate the correct button
    buttons.forEach(btn => {
        const btnText = btn.textContent.trim().toLowerCase();
        if (
            (period === 'today' && btnText === 'today') ||
            (period === 'week' && btnText === 'this week') ||
            (period === 'month' && btnText === 'this month') ||
            (period === 'year' && btnText === 'this year') ||
            (period === 'all' && btnText === 'all time')
        ) {
            btn.classList.add('active');
        }
    });
    
    const { startDate, endDate } = getDateRange(period);
    
    // Filter orders based on order date
    filteredOrders = allOrders.filter(order => {
        const orderDate = parseDate(order.orderDate);
        if (!orderDate) return false;
        return orderDate >= startDate && orderDate <= endDate;
    });
    
    console.log(`📊 Filtered ${filteredOrders.length} orders for period: ${period}`);
    
    updatePeriodText(period, startDate, endDate);
    calculateAndDisplayStats();
    displayOrdersTable();
}

// Apply custom date range
function applyCustomDateRange() {
    const startInput = document.getElementById('startDate').value;
    const endInput = document.getElementById('endDate').value;
    
    if (!startInput || !endInput) {
        alert('⚠️ Please select both start and end dates!');
        return;
    }
    
    const startDate = new Date(startInput);
    const endDate = new Date(endInput);
    endDate.setHours(23, 59, 59, 999);
    
    if (startDate > endDate) {
        alert('⚠️ Start date cannot be after end date!');
        return;
    }
    
    // Clear all filter buttons
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    currentPeriod = 'custom';
    
    // Filter orders by custom date range
    filteredOrders = allOrders.filter(order => {
        const orderDate = parseDate(order.orderDate);
        if (!orderDate) return false;
        return orderDate >= startDate && orderDate <= endDate;
    });
    
    console.log(`📊 Custom filter: ${filteredOrders.length} orders`);
    
    updatePeriodText('custom', startDate, endDate);
    calculateAndDisplayStats();
    displayOrdersTable();
}

// Update period text display
function updatePeriodText(period, startDate, endDate) {
    const periodText = document.getElementById('currentPeriodText');
    
    const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };
    
    switch(period) {
        case 'today':
            periodText.textContent = 'Today (' + formatDate(new Date()) + ')';
            break;
        case 'week':
            periodText.textContent = `This Week (${formatDate(startDate)} - ${formatDate(endDate)})`;
            break;
        case 'month':
            periodText.textContent = 'This Month (' + new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) + ')';
            break;
        case 'year':
            periodText.textContent = 'This Year (' + new Date().getFullYear() + ')';
            break;
        case 'all':
            periodText.textContent = 'All Time';
            break;
        case 'custom':
            periodText.textContent = `Custom Range: ${formatDate(startDate)} - ${formatDate(endDate)}`;
            break;
        default:
            periodText.textContent = 'Custom Period';
    }
}

// Calculate and display all statistics
function calculateAndDisplayStats() {
    // Financial Statistics
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    const paidAmount = filteredOrders
        .filter(order => order.paymentStatus === 'Paid')
        .reduce((sum, order) => sum + order.totalAmount, 0);
    
    const unpaidAmount = filteredOrders
        .filter(order => order.paymentStatus === 'Unpaid')
        .reduce((sum, order) => sum + order.remainingAmount, 0);
    
    const advanceReceived = filteredOrders.reduce((sum, order) => sum + order.advancePaid, 0);
    
    // Update financial cards
    document.getElementById('totalRevenue').textContent = `Rs. ${totalRevenue.toFixed(2)}`;
    document.getElementById('paidAmount').textContent = `Rs. ${paidAmount.toFixed(2)}`;
    document.getElementById('unpaidAmount').textContent = `Rs. ${unpaidAmount.toFixed(2)}`;
    document.getElementById('advanceReceived').textContent = `Rs. ${advanceReceived.toFixed(2)}`;
    
    // Order Statistics
    const totalOrders = filteredOrders.length;
    const pendingOrders = filteredOrders.filter(order => order.status === 'Pending').length;
    const inProgressOrders = filteredOrders.filter(order => order.status === 'In Progress').length;
    const completedOrders = filteredOrders.filter(order => order.status === 'Completed').length;
    
    // Update order stat cards
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('inProgressOrders').textContent = inProgressOrders;
    document.getElementById('completedOrders').textContent = completedOrders;
    
    // Update breakdowns
    updateDressTypeBreakdown();
    updatePaymentStatusBreakdown();
    updateTopWorkersBreakdown();
    updateTopCuttersBreakdown(); // NEW: Added cutters breakdown
}

// Update dress type breakdown
function updateDressTypeBreakdown() {
    const dressTypeCounts = {};
    
    filteredOrders.forEach(order => {
        const dressType = order.dressType || 'Unknown';
        dressTypeCounts[dressType] = (dressTypeCounts[dressType] || 0) + 1;
    });
    
    const container = document.getElementById('dressTypeBreakdown');
    container.innerHTML = '';
    
    if (Object.keys(dressTypeCounts).length === 0) {
        container.innerHTML = '<p style="color: #8b6914; text-align: center; padding: 20px;">No data available</p>';
        return;
    }
    
    // Sort by count (descending)
    const sorted = Object.entries(dressTypeCounts).sort((a, b) => b[1] - a[1]);
    
    sorted.forEach(([dressType, count]) => {
        const item = document.createElement('div');
        item.className = 'breakdown-item';
        item.innerHTML = `
            <span class="breakdown-item-name">${dressType}</span>
            <span class="breakdown-item-value">${count} orders</span>
        `;
        container.appendChild(item);
    });
}

// Update payment status breakdown
function updatePaymentStatusBreakdown() {
    const paidCount = filteredOrders.filter(order => order.paymentStatus === 'Paid').length;
    const unpaidCount = filteredOrders.filter(order => order.paymentStatus === 'Unpaid').length;
    
    const container = document.getElementById('paymentStatusBreakdown');
    container.innerHTML = '';
    
    if (filteredOrders.length === 0) {
        container.innerHTML = '<p style="color: #8b6914; text-align: center; padding: 20px;">No data available</p>';
        return;
    }
    
    // Paid orders
    const paidItem = document.createElement('div');
    paidItem.className = 'breakdown-item';
    paidItem.innerHTML = `
        <span class="breakdown-item-name">✅ Paid Orders</span>
        <span class="breakdown-item-value">${paidCount} orders</span>
    `;
    container.appendChild(paidItem);
    
    // Unpaid orders
    const unpaidItem = document.createElement('div');
    unpaidItem.className = 'breakdown-item';
    unpaidItem.innerHTML = `
        <span class="breakdown-item-name">⚠️ Unpaid Orders</span>
        <span class="breakdown-item-value">${unpaidCount} orders</span>
    `;
    container.appendChild(unpaidItem);
}

// NEW: Update top workers breakdown
function updateTopWorkersBreakdown() {
    const workerCounts = {};
    
    // Count orders by worker (only In Progress and Completed orders)
    filteredOrders.forEach(order => {
        if ((order.status === 'In Progress' || order.status === 'Completed') && 
            order.workerName && order.workerName.trim() !== '') {
            workerCounts[order.workerName] = (workerCounts[order.workerName] || 0) + 1;
        }
    });
    
    const container = document.getElementById('topWorkersBreakdown');
    container.innerHTML = '';
    
    if (Object.keys(workerCounts).length === 0) {
        container.innerHTML = '<p style="color: #8b6914; text-align: center; padding: 20px;">No workers assigned yet</p>';
        return;
    }
    
    // Sort by count (descending) and take top 5
    const sorted = Object.entries(workerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    sorted.forEach(([worker, count], index) => {
        const item = document.createElement('div');
        item.className = 'breakdown-item';
        
        // Add medal emoji for top 3
        let medal = '';
        if (index === 0) medal = '🥇 ';
        else if (index === 1) medal = '🥈 ';
        else if (index === 2) medal = '🥉 ';
        
        item.innerHTML = `
            <span class="breakdown-item-name">${medal}${worker}</span>
            <span class="breakdown-item-value">${count} orders</span>
        `;
        container.appendChild(item);
    });
}

// NEW: Update top cutters breakdown
function updateTopCuttersBreakdown() {
    const cutterCounts = {};
    
    // Count orders by cutter (only In Progress and Completed orders)
    filteredOrders.forEach(order => {
        if ((order.status === 'In Progress' || order.status === 'Completed') && 
            order.cutterName && order.cutterName.trim() !== '') {
            cutterCounts[order.cutterName] = (cutterCounts[order.cutterName] || 0) + 1;
        }
    });
    
    const container = document.getElementById('topCuttersBreakdown');
    container.innerHTML = '';
    
    if (Object.keys(cutterCounts).length === 0) {
        container.innerHTML = '<p style="color: #8b6914; text-align: center; padding: 20px;">No cutters assigned yet</p>';
        return;
    }
    
    // Sort by count (descending) and take top 5
    const sorted = Object.entries(cutterCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    sorted.forEach(([cutter, count], index) => {
        const item = document.createElement('div');
        item.className = 'breakdown-item';
        
        // Add medal emoji for top 3
        let medal = '';
        if (index === 0) medal = '🥇 ';
        else if (index === 1) medal = '🥈 ';
        else if (index === 2) medal = '🥉 ';
        
        item.innerHTML = `
            <span class="breakdown-item-name">${medal}${cutter}</span>
            <span class="breakdown-item-value">${count} orders</span>
        `;
        container.appendChild(item);
    });
}

// Display orders in table
function displayOrdersTable(ordersToDisplay = filteredOrders) {
    const tbody = document.getElementById('salesTableBody');
    tbody.innerHTML = '';
    
    if (ordersToDisplay.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: #8b6914;">
                    <div style="font-size: 3em; margin-bottom: 10px;">📊</div>
                    <div style="font-size: 1.2em; font-weight: 600;">No orders found for this period</div>
                    <div style="font-size: 0.9em; margin-top: 5px;">Try selecting a different date range</div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by order date (newest first)
    ordersToDisplay.sort((a, b) => {
        const dateA = parseDate(a.orderDate);
        const dateB = parseDate(b.orderDate);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB - dateA;
    });
    
    ordersToDisplay.forEach(order => {
        const row = document.createElement('tr');
        
        // Status badge styling
        let statusClass = 'status-pending';
        if (order.status === 'In Progress') statusClass = 'status-progress';
        if (order.status === 'Completed') statusClass = 'status-completed';
        
        // Payment badge styling
        const paymentClass = order.paymentStatus === 'Paid' ? 'payment-paid' : 'payment-unpaid';
        const paymentText = order.paymentStatus === 'Paid' ? '✓ Paid' : '⚠ Unpaid';
        
        row.innerHTML = `
            <td>${order.orderId}</td>
            <td>${order.orderDate}</td>
            <td>${order.customerName}</td>
            <td>${order.dressType}</td>
            <td><span class="status-badge ${statusClass}">${order.status}</span></td>
            <td>Rs. ${order.totalAmount.toFixed(2)}</td>
            <td>Rs. ${order.advancePaid.toFixed(2)}</td>
            <td>Rs. ${order.remainingAmount.toFixed(2)}</td>
            <td><span class="status-badge ${paymentClass}">${paymentText}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Search functionality
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        displayOrdersTable(filteredOrders);
        return;
    }
    
    const searched = filteredOrders.filter(order => 
        order.orderId.toLowerCase().includes(searchTerm) ||
        order.customerName.toLowerCase().includes(searchTerm) ||
        order.customerPhone.includes(searchTerm) ||
        order.dressType.toLowerCase().includes(searchTerm) ||
        (order.workerName && order.workerName.toLowerCase().includes(searchTerm)) ||
        (order.cutterName && order.cutterName.toLowerCase().includes(searchTerm))
    );
    
    displayOrdersTable(searched);
}

// Print report
function printReport() {
    const reportContent = generateReportHTML();
    
    const printDiv = document.getElementById('printReport');
    printDiv.innerHTML = reportContent;
    printDiv.style.display = 'block';
    
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            printDiv.style.display = 'none';
        }, 100);
    }, 100);
}

// Generate report HTML for printing
function generateReportHTML() {
    const periodText = document.getElementById('currentPeriodText').textContent;
    const today = new Date().toLocaleDateString('en-GB');
    
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const paidAmount = filteredOrders.filter(order => order.paymentStatus === 'Paid')
        .reduce((sum, order) => sum + order.totalAmount, 0);
    const unpaidAmount = filteredOrders.filter(order => order.paymentStatus === 'Unpaid')
        .reduce((sum, order) => sum + order.remainingAmount, 0);
    const advanceReceived = filteredOrders.reduce((sum, order) => sum + order.advancePaid, 0);
    
    const totalOrders = filteredOrders.length;
    const pendingOrders = filteredOrders.filter(o => o.status === 'Pending').length;
    const inProgressOrders = filteredOrders.filter(o => o.status === 'In Progress').length;
    const completedOrders = filteredOrders.filter(o => o.status === 'Completed').length;
    const paidOrders = filteredOrders.filter(o => o.paymentStatus === 'Paid').length;
    const unpaidOrders = filteredOrders.filter(o => o.paymentStatus === 'Unpaid').length;
    
    let html = `
        <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 40px; border-bottom: 4px solid #d4af37; padding-bottom: 20px;">
                <h1 style="color: #654321; font-size: 2.8em; margin: 0 0 10px 0;">AFTAB TAILORS</h1>
                <h2 style="color: #8b6914; font-size: 1.8em; margin: 0;">Sales Report</h2>
                <p style="color: #8b6914; margin-top: 15px; font-size: 1.1em;"><strong>Period:</strong> ${periodText}</p>
                <p style="color: #8b6914; font-size: 0.95em;">Report Generated: ${today}</p>
            </div>
            
            <div style="margin-bottom: 35px;">
                <h3 style="color: #654321; border-bottom: 3px solid #d4af37; padding-bottom: 12px; font-size: 1.5em;">💰 Financial Summary</h3>
                <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                    <tr style="background: #fef9e7;">
                        <td style="padding: 12px; font-weight: bold; border: 1px solid #f0e68c;">Total Revenue:</td>
                        <td style="padding: 12px; text-align: right; border: 1px solid #f0e68c; font-size: 1.2em; color: #654321;"><strong>Rs. ${totalRevenue.toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border: 1px solid #f0e68c;">Paid Amount:</td>
                        <td style="padding: 12px; text-align: right; border: 1px solid #f0e68c; color: #0f5132; font-size: 1.1em;"><strong>Rs. ${paidAmount.toFixed(2)}</strong></td>
                    </tr>
                    <tr style="background: #fef9e7;">
                        <td style="padding: 12px; font-weight: bold; border: 1px solid #f0e68c;">Unpaid Amount:</td>
                        <td style="padding: 12px; text-align: right; border: 1px solid #f0e68c; color: #c62828; font-size: 1.1em;"><strong>Rs. ${unpaidAmount.toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border: 1px solid #f0e68c;">Advance Received:</td>
                        <td style="padding: 12px; text-align: right; border: 1px solid #f0e68c; font-size: 1.1em;">Rs. ${advanceReceived.toFixed(2)}</td>
                    </tr>
                </table>
            </div>
            
            <div style="margin-bottom: 35px;">
                <h3 style="color: #654321; border-bottom: 3px solid #d4af37; padding-bottom: 12px; font-size: 1.5em;">📊 Order Statistics</h3>
                <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                    <tr style="background: #fef9e7;">
                        <td style="padding: 12px; font-weight: bold; border: 1px solid #f0e68c;">Total Orders:</td>
                        <td style="padding: 12px; text-align: right; border: 1px solid #f0e68c; font-size: 1.2em; color: #654321;"><strong>${totalOrders}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border: 1px solid #f0e68c;">⏳ Pending:</td>
                        <td style="padding: 12px; text-align: right; border: 1px solid #f0e68c;">${pendingOrders}</td>
                    </tr>
                    <tr style="background: #fef9e7;">
                        <td style="padding: 12px; font-weight: bold; border: 1px solid #f0e68c;">🔄 In Progress:</td>
                        <td style="padding: 12px; text-align: right; border: 1px solid #f0e68c;">${inProgressOrders}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border: 1px solid #f0e68c;">✅ Completed:</td>
                        <td style="padding: 12px; text-align: right; border: 1px solid #f0e68c;">${completedOrders}</td>
                    </tr>
                    <tr style="background: #fef9e7;">
                        <td style="padding: 12px; font-weight: bold; border: 1px solid #f0e68c; border-top: 2px solid #d4af37;">Paid Orders:</td>
                        <td style="padding: 12px; text-align: right; border: 1px solid #f0e68c; border-top: 2px solid #d4af37; color: #0f5132;"><strong>${paidOrders}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border: 1px solid #f0e68c;">Unpaid Orders:</td>
                        <td style="padding: 12px; text-align: right; border: 1px solid #f0e68c; color: #c62828;"><strong>${unpaidOrders}</strong></td>
                    </tr>
                </table>
            </div>
            
            <div style="margin-top: 50px; text-align: center; padding-top: 25px; border-top: 3px solid #d4af37;">
                <p style="color: #8b6914; font-size: 1.1em; margin: 0;">Thank you for your business!</p>
                <p style="color: #8b6914; font-size: 1em; margin: 10px 0 0 0;">Aftab Tailors - Quality Stitching Services</p>
                <p style="color: #8b6914; font-size: 0.9em; margin: 5px 0 0 0;">📞 Contact us for custom orders</p>
            </div>
        </div>
    `;
    
    return html;
}

// Make functions globally accessible for onclick handlers in HTML
window.filterByPeriod = filterByPeriod;
window.applyCustomDateRange = applyCustomDateRange;
window.reloadData = reloadData;
window.printReport = printReport;
window.logout = logout;