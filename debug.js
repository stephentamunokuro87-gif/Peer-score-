// debug.js - Add this script to help debug
console.log('=== P2P Payment Debug Mode ===');

// Make Firebase available globally for debugging
window.firebase = firebase;

// Add debug button to test connection
document.addEventListener('DOMContentLoaded', () => {
  const debugDiv = document.createElement('div');
  debugDiv.style.position = 'fixed';
  debugDiv.style.bottom = '10px';
  debugDiv.style.right = '10px';
  debugDiv.style.zIndex = '1000';
  debugDiv.innerHTML = `
        <button id="debugBtn" style="padding:5px 10px; background:#666; color:white; border:none; border-radius:3px;">
            Debug
        </button>
    `;
  document.body.appendChild(debugDiv);
  
  document.getElementById('debugBtn').addEventListener('click', async () => {
    console.log('=== DEBUG INFO ===');
    console.log('Current User:', currentUser);
    console.log('User Data:', userData);
    
    // Test Firestore connection
    try {
      const testDoc = await db.collection('users').doc(currentUser.uid).get();
      console.log('Firestore Test:', testDoc.exists ? 'Connected' : 'No document');
      
      // List all users
      const allUsers = await db.collection('users').get();
      console.log('All Users:');
      allUsers.forEach(doc => {
        console.log(`- ${doc.id}: ${doc.data().name} ($${doc.data().balance})`);
      });
    } catch (error) {
      console.error('Firestore Error:', error);
    }
  });
});