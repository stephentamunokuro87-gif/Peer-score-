// DOM Elements
const userBalance = document.getElementById('userBalance');
const currentUserId = document.getElementById('currentUserId');
const transferForm = document.getElementById('transferForm');
const logoutBtn = document.getElementById('logoutBtn');
const transactionsList = document.getElementById('transactionsList');
const transferError = document.getElementById('transferError');
const transferSuccess = document.getElementById('transferSuccess');

let currentUser = null;
let userData = null;

// Initialize
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    currentUserId.textContent = user.uid.substring(0, 8) + '...'; // Show truncated ID
    await loadUserData();
    await loadTransactions();
  } else {
    window.location.href = 'index.html';
  }
});

// Load user data from Firestore
async function loadUserData() {
  try {
    const doc = await db.collection('users').doc(currentUser.uid).get();
    if (doc.exists) {
      userData = doc.data();
      userBalance.textContent = `$${userData.balance.toFixed(2)}`;
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    showError('Error loading balance: ' + error.message);
  }
}

// Load transaction history
async function loadTransactions() {
  try {
    const sentQuery = await db.collection('transactions')
      .where('senderId', '==', currentUser.uid)
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();
    
    const receivedQuery = await db.collection('transactions')
      .where('recipientId', '==', currentUser.uid)
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();
    
    const allTransactions = [];
    
    sentQuery.forEach(doc => {
      allTransactions.push({ ...doc.data(), id: doc.id, type: 'sent' });
    });
    
    receivedQuery.forEach(doc => {
      allTransactions.push({ ...doc.data(), id: doc.id, type: 'received' });
    });
    
    // Sort by timestamp
    allTransactions.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
    
    // Display transactions
    displayTransactions(allTransactions);
    
  } catch (error) {
    console.error('Error loading transactions:', error);
    if (error.code === 'failed-precondition') {
      console.log('Need to create composite index for queries');
      showError('Setting up database indexes... Please try again in a moment.');
    }
  }
}

// Display transactions in the UI
function displayTransactions(transactions) {
  if (transactions.length === 0) {
    transactionsList.innerHTML = '<p class="no-transactions">No transactions yet</p>';
    return;
  }
  
  transactionsList.innerHTML = '';
  transactions.forEach(transaction => {
    const transactionElement = document.createElement('div');
    transactionElement.className = 'transaction-item';
    
    const date = transaction.timestamp.toDate().toLocaleString();
    const amount = transaction.amount.toFixed(2);
    const isSent = transaction.type === 'sent';
    
    transactionElement.innerHTML = `
            <div class="transaction-header">
                <strong>${isSent ? 'Sent to:' : 'Received from:'} ${isSent ? transaction.recipientName : transaction.senderName}</strong>
                <span class="amount ${isSent ? 'sent' : 'received'}">${isSent ? '-' : '+'}$${amount}</span>
            </div>
            <p class="transaction-id">ID: ${transaction.id.substring(0, 10)}...</p>
            <small>${date}</small>
        `;
    
    transactionsList.appendChild(transactionElement);
  });
}

// Handle money transfer - FIXED VERSION
transferForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const recipientIdInput = document.getElementById('recipientId');
  const amountInput = document.getElementById('amount');
  
  const recipientId = recipientIdInput.value.trim();
  const amount = parseFloat(amountInput.value);
  
  transferError.style.display = 'none';
  transferSuccess.style.display = 'none';
  
  // Clear any previous errors
  recipientIdInput.classList.remove('error');
  amountInput.classList.remove('error');
  
  // Validation
  let hasError = false;
  
  if (!recipientId) {
    showError('Please enter recipient User ID');
    recipientIdInput.classList.add('error');
    hasError = true;
  }
  
  if (!amount || amount <= 0) {
    showError('Amount must be greater than 0');
    amountInput.classList.add('error');
    hasError = true;
  }
  
  if (amount > userData.balance) {
    showError('Insufficient balance');
    amountInput.classList.add('error');
    hasError = true;
  }
  
  if (recipientId === currentUser.uid) {
    showError('Cannot send money to yourself');
    recipientIdInput.classList.add('error');
    hasError = true;
  }
  
  if (hasError) return;
  
  try {
    console.log('Starting transfer...');
    console.log('Recipient ID:', recipientId);
    console.log('Amount:', amount);
    console.log('Sender Balance:', userData.balance);
    
    // Get recipient data
    const recipientRef = db.collection('users').doc(recipientId);
    const recipientDoc = await recipientRef.get();
    
    if (!recipientDoc.exists) {
      throw new Error('Recipient not found. Please check the User ID.');
    }
    
    const recipientData = recipientDoc.data();
    console.log('Recipient found:', recipientData.name);
    
    // Start a transaction batch
    const batch = db.batch();
    
    // Update sender balance
    const senderRef = db.collection('users').doc(currentUser.uid);
    const newSenderBalance = userData.balance - amount;
    batch.update(senderRef, {
      balance: newSenderBalance
    });
    
    // Update recipient balance
    const newRecipientBalance = recipientData.balance + amount;
    batch.update(recipientRef, {
      balance: newRecipientBalance
    });
    
    // Create transaction record
    const transactionRef = db.collection('transactions').doc();
    batch.set(transactionRef, {
      senderId: currentUser.uid,
      senderName: userData.name,
      recipientId: recipientId,
      recipientName: recipientData.name,
      amount: amount,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });
    
    // Commit the batch
    await batch.commit();
    console.log('Transfer completed successfully');
    
    // Update local balance
    userData.balance = newSenderBalance;
    userBalance.textContent = `$${newSenderBalance.toFixed(2)}`;
    
    // Show success message
    transferSuccess.textContent = `Successfully sent $${amount.toFixed(2)} to ${recipientData.name}`;
    transferSuccess.style.display = 'block';
    
    // Clear form
    transferForm.reset();
    
    // Reload transactions
    await loadTransactions();
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      transferSuccess.style.display = 'none';
    }, 5000);
    
  } catch (error) {
    console.error('Transfer error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    let errorMessage = error.message;
    
    // Provide more helpful error messages
    if (error.code === 'permission-denied') {
      errorMessage = 'Permission denied. Please check Firestore security rules.';
    } else if (error.code === 'not-found') {
      errorMessage = 'Recipient not found. Please check the User ID.';
    } else if (error.code === 'invalid-argument') {
      errorMessage = 'Invalid data. Please check the amount.';
    }
    
    showError(errorMessage);
  }
});

// Show error message
function showError(message) {
  transferError.textContent = message;
  transferError.style.display = 'block';
}

// Logout
logoutBtn.addEventListener('click', async () => {
  try {
    await auth.signOut();
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout error:', error);
    showError('Logout failed: ' + error.message);
  }
});

// Add a helper to copy user ID
document.addEventListener('DOMContentLoaded', () => {
  // Add copy to clipboard functionality
  currentUserId.addEventListener('click', () => {
    const fullId = currentUser ? currentUser.uid : '';
    navigator.clipboard.writeText(fullId).then(() => {
      const originalText = currentUserId.textContent;
      currentUserId.textContent = 'Copied!';
      setTimeout(() => {
        currentUserId.textContent = originalText;
      }, 2000);
    });
  });
});