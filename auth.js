// Check authentication state
auth.onAuthStateChanged((user) => {
  if (user && window.location.pathname.includes('index.html')) {
    window.location.href = 'home.html';
  }
  if (user && window.location.pathname.includes('login.html')) {
    window.location.href = 'home.html';
  }
  if (!user && window.location.pathname.includes('home.html')) {
    window.location.href = 'index.html';
  }
});

// Sign Up Function
if (document.getElementById('signupForm')) {
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    
    try {
      // Create user with email and password
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore with $30 welcome bonus
      await db.collection('users').doc(user.uid).set({
        name: name,
        email: email,
        balance: 30.00,
        userId: user.uid,
        createdAt: new Date()
      });
      
      successMessage.textContent = 'Account created successfully! $30 welcome bonus added.';
      successMessage.style.display = 'block';
      
      // Redirect to home page after 2 seconds
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 2000);
      
    } catch (error) {
      errorMessage.textContent = error.message;
      errorMessage.style.display = 'block';
    }
  });
}

// Login Function
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.style.display = 'none';
    
    try {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = 'home.html';
    } catch (error) {
      errorMessage.textContent = error.message;
      errorMessage.style.display = 'block';
    }
  });
}