// --- Element Selections ---


const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const messageContainer = document.getElementById('message-container');



// --- Functions ---


function displayMessage(message, type) {
  messageContainer.textContent = message;
  messageContainer.className = type;
}

function isValidEmail(email) {
   const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
  
}

function isValidPassword(password) {
  return password.length >= 8;
}


async function handleLogin(event) {
  
  event.preventDefault();


  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!isValidEmail(email)) {
    displayMessage('Invalid email format.', 'error');
    return;
}
  

  if (!isValidPassword(password)){

    displayMessage('Password must be at least 8 characters.', 'error');
    return;

  }


  try {

    const response = await fetch('./api/index.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();



        if (data.success) {
           displayMessage('Login successful! Redirecting...', 'success');
            emailInput.value = '';
            passwordInput.value = '';

            setTimeout(() => {
                window.location.href = '../admin/index.php';
            }, 1500);
        }

        else {
          displayMessage(data.message || 'Login failed. Please try again.', 'error');
        }
      }

      catch(error){
          console.error('Login error:', error);
        displayMessage('An error occurred. Please try again.', 'error');
    }

}



function setupLoginForm() {
  if(loginForm){
    loginForm.addEventListener('submit', handleLogin);
    

  }
}


setupLoginForm();
