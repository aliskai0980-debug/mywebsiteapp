let bills = JSON.parse(localStorage.getItem('bills')) || [];
let currentFilter = 'all';

// ✅ التاريخ بالألمانية
function displayCurrentDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('currentDate').innerHTML = `📅 ${now.toLocaleDateString('de-DE', options)}`;
}

function addBill() {
    const name = document.getElementById('billName').value;
    const amount = parseFloat(document.getElementById('billAmount').value);
    const type = document.getElementById('billType').value;
    const date = document.getElementById('billDate').value;
    const dueDay = parseInt(document.getElementById('billDay').value);

    if (!name || isNaN(amount) || amount <= 0) {
        alert('الرجاء إدخال اسم الفاتورة والمبلغ بشكل صحيح');
        return;
    }

    const newBill = {
        id: Date.now(),
        name, amount, type,
        date: date || new Date().toISOString().split('T')[0],
        dueDay: dueDay || new Date().getDate(),
        paid: false,
        createdAt: new Date().toISOString()
    };

    bills.push(newBill);
    saveAndRender();

    document.getElementById('billName').value = '';
    document.getElementById('billAmount').value = '';
    document.getElementById('billDate').value = '';
    document.getElementById('billDay').value = '';
}

function payBill(id) {
    const bill = bills.find(b => b.id === id);
    if (bill) { bill.paid = true; saveAndRender(); }
}

function deleteBill(id) {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
        bills = bills.filter(b => b.id !== id);
        saveAndRender();
    }
}

function filterBills(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderBillsList();
}

// ✅ العملة يورو €
function calculateStats() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyBills = bills.filter(bill => {
        const billDate = new Date(bill.date);
        return billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear;
    });

    const expenses  = monthlyBills.filter(b => b.type === 'expense' && !b.paid).reduce((s, b) => s + b.amount, 0);
    const payments  = monthlyBills.filter(b => b.type === 'payment' && !b.paid).reduce((s, b) => s + b.amount, 0);
    const penalties = monthlyBills.filter(b => b.type === 'penalty' && !b.paid).reduce((s, b) => s + b.amount, 0);
    const total = expenses + payments + penalties;

    document.getElementById('totalExpenses').innerHTML  = `${expenses.toFixed(2)} €`;
    document.getElementById('totalPayments').innerHTML  = `${payments.toFixed(2)} €`;
    document.getElementById('totalPenalties').innerHTML = `${penalties.toFixed(2)} €`;
    document.getElementById('totalAll').innerHTML       = `${total.toFixed(2)} €`;
}

function renderBillsList() {
    const now = new Date();
    const currentDay = now.getDate();

    let filteredBills = bills.filter(bill => {
        if (currentFilter === 'all')     return true;
        if (currentFilter === 'expense') return bill.type === 'expense';
        if (currentFilter === 'payment') return bill.type === 'payment';
        if (currentFilter === 'penalty') return bill.type === 'penalty';
        if (currentFilter === 'overdue') return !bill.paid && bill.dueDay < currentDay;
        return true;
    });

    const billsListDiv = document.getElementById('billsList');

    if (filteredBills.length === 0) {
        billsListDiv.innerHTML = '<div style="text-align:center;padding:40px;color:#666;">✨ لا توجد فواتير للعرض</div>';
        return;
    }

    const typeIcon = { expense: '💸', payment: '💰', penalty: '⚠️' };

    billsListDiv.innerHTML = filteredBills.map(bill => {
        const isOverdue = !bill.paid && bill.dueDay < now.getDate();
        const typeClass = isOverdue ? 'overdue' : bill.type;

        return `
            <div class="bill-item ${typeClass}">
                <div class="bill-info">
                    <div class="bill-name">${typeIcon[bill.type]} ${bill.name}</div>
                    <div class="bill-details">
                        📅 Datum: ${bill.date} | ⏰ Fällig: Tag ${bill.dueDay}
                        ${bill.paid ? ' | ✅ Bezahlt' : (isOverdue ? ' | ⏰ Überfällig!' : '')}
                    </div>
                </div>
                <div class="bill-amount ${bill.type}">${bill.amount.toFixed(2)} €</div>
                <div class="bill-actions">
                    ${!bill.paid ? `<button class="btn-paid" onclick="payBill(${bill.id})">✅ دفع</button>` : ''}
                    <button class="btn-delete" onclick="deleteBill(${bill.id})">🗑️ حذف</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderReminders() {
    const now = new Date();
    const upcomingBills = bills.filter(bill =>
        !bill.paid && bill.dueDay >= now.getDate() && bill.dueDay <= now.getDate() + 7
    );

    const reminderDiv = document.getElementById('reminderContent');

    if (upcomingBills.length === 0) {
        reminderDiv.innerHTML = '<p>✨ لا توجد تذكيرات للفترة القادمة</p>';
        return;
    }

    reminderDiv.innerHTML = upcomingBills.map(bill => `
        <div class="reminder-item">
            <strong>🔔 ${bill.name}</strong><br>
            Betrag: ${bill.amount.toFixed(2)} €<br>
            Fällig: Tag ${bill.dueDay} des Monats
            ${bill.dueDay === now.getDate() ? ' <span style="color:red;">(Heute!)</span>' : ''}
        </div>
    `).join('');
}

function saveAndRender() {
    localStorage.setItem('bills', JSON.stringify(bills));
    calculateStats();
    renderBillsList();
    renderReminders();
}

function init() {
    displayCurrentDate();
    calculateStats();
    renderBillsList();
    renderReminders();
    setInterval(() => {
        displayCurrentDate();
        calculateStats();
        renderBillsList();
        renderReminders();
    }, 60000);
}

init();