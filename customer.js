// Customer Management System - JavaScript (Firebase Realtime Database)
// UPDATED: Print button removed from actions

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
    console.log("✅ Firebase initialized successfully");
} else {
    console.log("✅ Firebase already initialized");
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
let customers = [];
let editingCustomerId = null;

// Reference to the 'customers' section in the database
const customersRef = db.ref('customers'); 

// Field labels for display (matching the sequence 1-47)
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
    console.log("🚀 Page loaded, checking authentication...");
    
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log("✅ User authenticated:", user.email);
            loadCustomers();
            setupEventListeners();
            setRegistrationDate();
            generateCustomerId();
        } else {
            console.log("❌ No user authenticated, redirecting to login...");
            window.location.href = 'login.html';
        }
    });
});

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('customerForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('clearBtn').addEventListener('click', clearForm);
    document.getElementById('cancelBtn').addEventListener('click', cancelEdit);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
}

// Load customers from Realtime Database
function loadCustomers() {
    console.log("📡 Loading customers from database...");
    
    customersRef.on('value', (snapshot) => {
        customers = [];
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                customers.push(childSnapshot.val());
            });
            console.log(`✅ Loaded ${customers.length} customers`);
        } else {
            console.log("ℹ️ No customers found in database");
        }
        displayCustomers(customers);
        generateCustomerId();
    }, (error) => {
        console.error("❌ Error loading customers:", error);
        alert("Error loading customers: " + error.message);
        displayCustomers([]);
    });
}

// Save customer data to Realtime Database
function saveToDatabase(customerData) {
    console.log("💾 Saving customer to database:", customerData.id);
    return customersRef.child(customerData.id).set(customerData);
}

// Generate unique customer ID 
function generateCustomerId() {
    if (editingCustomerId) return;
    
    const lastId = customers.length > 0 
        ? Math.max(...customers.map(c => parseInt(c.id.replace('CUS', '')) || 0))
        : 0;
        
    const newId = 'CUS' + String(lastId + 1).padStart(4, '0');
    document.getElementById('customerId').value = newId;
}

// Set current date
function setRegistrationDate() {
    if (editingCustomerId) return;
    
    const today = new Date();
    const formattedDate = formatDate(today);
    document.getElementById('regDate').value = formattedDate;
}

// Format date to DD/MM/YYYY
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    console.log("📝 Form submitted");
    
    const customerData = {
        id: document.getElementById('customerId').value,
        name: document.getElementById('customerName').value.trim(),
        phone: document.getElementById('phoneNumber').value.trim(),
        regDate: document.getElementById('regDate').value,
        
        // Fields 1-9: Measurements 
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
        
        // Fields 10-47: Design Details 
        design: {
            field10: document.getElementById('field10').value.trim(),
            field11: document.getElementById('field11').value.trim(),
            field12: document.getElementById('field12').value.trim(),
            field13: document.getElementById('field13').value.trim(),
            field14: document.getElementById('field14').value.trim(),
            field15: document.getElementById('field15').value.trim(),
            field16: document.getElementById('field16').value.trim(),
            field17: document.getElementById('field17').value.trim(),
            field18: document.getElementById('field18').value.trim(),
            field19: document.getElementById('field19').value.trim(),
            field20: document.getElementById('field20').value.trim(),
            field21: document.getElementById('field21').value.trim(),
            field22: document.getElementById('field22').value.trim(),
            field23: document.getElementById('field23').value.trim(),
            field24: document.getElementById('field24').value.trim(),
            field25: document.getElementById('field25').value.trim(),
            field26: document.getElementById('field26').value.trim(),
            field27: document.getElementById('field27').value.trim(),
            field28: document.getElementById('field28').value.trim(),
            field29: document.getElementById('field29').value.trim(),
            field30: document.getElementById('field30').value.trim(),
            field31: document.getElementById('field31').value.trim(),
            field32: document.getElementById('field32').value.trim(),
            field33: document.getElementById('field33').value.trim(),
            field34: document.getElementById('field34').value.trim(),
            field35: document.getElementById('field35').value.trim(),
            field36: document.getElementById('field36').value.trim(),
            field37: document.getElementById('field37').value.trim(),
            field38: document.getElementById('field38').value.trim(),
            field39: document.getElementById('field39').value.trim(),
            field40: document.getElementById('field40').value.trim(),
            field41: document.getElementById('field41').value.trim(),
            field42: document.getElementById('field42').value.trim(),
            field43: document.getElementById('field43').value.trim(),
            field44: document.getElementById('field44').value.trim(),
            field45: document.getElementById('field45').value.trim(),
            field46: document.getElementById('field46').value.trim(),
            field47: document.getElementById('field47').value.trim(),
        },
        notes: document.getElementById('notes').value.trim()
    };
    
    // Check for duplicate phone number
    const isDuplicate = customers.some(c => 
        c.phone === customerData.phone && c.id !== customerData.id
    );
    
    if (isDuplicate) {
        alert('Error: A customer with this phone number already exists! (اس فون نمبر کے ساتھ گاہک پہلے ہی موجود ہے!)');
        document.getElementById('phoneNumber').focus();
        return; 
    }
    
    // Save to database
    saveToDatabase(customerData)
        .then(() => {
            console.log("✅ Customer saved successfully");
            if (editingCustomerId) {
                alert('Customer updated successfully! (گاہک کی تفصیلات اپ ڈیٹ ہو گئی!)');
            } else {
                alert('Customer added successfully! (نیا گاہک شامل ہو گیا!)');
            }
            clearForm();
        })
        .catch(error => {
            console.error("❌ Error saving customer:", error);
            alert('Error saving data to database: ' + error.message);
        });
}

// Clear form
function clearForm() {
    document.getElementById('customerForm').reset();
    editingCustomerId = null;
    setRegistrationDate();
    generateCustomerId();
    
    document.getElementById('formTitle').textContent = 'Add New Customer | نیا گاہک شامل کریں';
    document.getElementById('saveBtn').textContent = 'Save Customer (محفوظ کریں)';
    document.getElementById('cancelBtn').style.display = 'none';
}

// Cancel edit
function cancelEdit() {
    clearForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Display customers in table - UPDATED: Print button removed
function displayCustomers(customersToDisplay) {
    const tbody = document.getElementById('customerTableBody');
    tbody.innerHTML = '';
    
    if (customersToDisplay.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #8b6914;">No customers found (کوئی گاہک نہیں ملا)</td></tr>';
        return;
    }
    
    customersToDisplay.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.phone}</td>
            <td>${customer.regDate}</td>
            <td>
                <button class="action-btn btn-view" onclick="viewCustomer('${customer.id}')">View</button>
                <button class="action-btn btn-edit" onclick="editCustomer('${customer.id}')">Edit</button>
                <button class="action-btn btn-delete" onclick="deleteCustomer('${customer.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// View customer details
function viewCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    let details = `Customer Details (گاہک کی تفصیلات):\n\n`;
    details += `ID (کوڈ): ${customer.id}\n`;
    details += `Name (نام): ${customer.name}\n`;
    details += `Phone (فون): ${customer.phone}\n`;
    details += `Registration Date (تاریخ): ${customer.regDate}\n\n`;
    
    details += `MEASUREMENTS (پیمائش):\n`;
    details += `1. ${fieldLabels[0]}: ${customer.qameez.length}"\n`;
    details += `2. ${fieldLabels[1]}: ${customer.qameez.shoulder}"\n`;
    details += `3. ${fieldLabels[2]}: ${customer.qameez.sleeve}"\n`;
    details += `4. ${fieldLabels[3]}: ${customer.qameez.neck}"\n`;
    details += `5. ${fieldLabels[4]}: ${customer.qameez.chest}"\n`;
    details += `6. ${fieldLabels[5]}: ${customer.qameez.lowerHip || 'N/A'}"\n`;
    details += `7. ${fieldLabels[6]}: ${customer.qameez.bottom}"\n`;
    details += `8. ${fieldLabels[7]}: ${customer.shalwar.length}"\n`;
    details += `9. ${fieldLabels[8]}: ${customer.shalwar.bottom}"\n\n`;

    details += `DESIGN & STYLE DETAILS (ڈیزائن اور سٹائل):\n`;
    for (let i = 10; i <= 47; i++) {
        const fieldKey = `field${i}`;
        const value = customer.design[fieldKey];
        if (value && value.trim() !== '' && value !== '0') {
            details += `${i}. ${fieldLabels[i-1]}: ${value}\n`;
        }
    }

    if (customer.notes) {
        details += `\nSpecial Notes (خصوصی ہدایات):\n${customer.notes}`;
    }
    
    alert(details);
}

// Edit customer
function editCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    editingCustomerId = customerId;
    
    document.getElementById('customerId').value = customer.id;
    document.getElementById('customerName').value = customer.name;
    document.getElementById('phoneNumber').value = customer.phone;
    document.getElementById('regDate').value = customer.regDate;
    
    // Populate Fields 1-9
    document.getElementById('field1').value = customer.qameez.length;
    document.getElementById('field2').value = customer.qameez.shoulder;
    document.getElementById('field3').value = customer.qameez.sleeve;
    document.getElementById('field4').value = customer.qameez.neck;
    document.getElementById('field5').value = customer.qameez.chest;
    document.getElementById('field6').value = customer.qameez.lowerHip || '0';
    document.getElementById('field7').value = customer.qameez.bottom;
    document.getElementById('field8').value = customer.shalwar.length;
    document.getElementById('field9').value = customer.shalwar.bottom;
    
    // Populate Fields 10-47
    for (let i = 10; i <= 47; i++) {
        const fieldKey = `field${i}`;
        document.getElementById(fieldKey).value = customer.design[fieldKey] || '';
    }

    document.getElementById('notes').value = customer.notes;
    
    document.getElementById('formTitle').textContent = 'Edit Customer (گاہک کی تفصیلات میں ترمیم کریں)';
    document.getElementById('saveBtn').textContent = 'Update Customer (اپ ڈیٹ کریں)';
    document.getElementById('cancelBtn').style.display = 'block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Delete customer
function deleteCustomer(customerId) {
    if (!confirm('Are you sure you want to delete this customer? (کیا آپ واقعی اس گاہک کو حذف کرنا چاہتے ہیں؟)')) return;
    
    customersRef.child(customerId).remove()
        .then(() => {
            console.log("✅ Customer deleted successfully");
            alert('Customer deleted successfully! (گاہک کامیابی سے حذف کر دیا گیا!)');
        })
        .catch(error => {
            console.error("❌ Error deleting customer:", error);
            alert('Error deleting customer: ' + error.message);
        });
}

// Search functionality
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        displayCustomers(customers);
        return;
    }
    
    const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.phone.includes(searchTerm) ||
        customer.id.toLowerCase().includes(searchTerm)
    );
    
    displayCustomers(filtered);
}