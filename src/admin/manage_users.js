
let users = [];

const userTableBody = document.getElementById('user-table-body');
const addUserForm = document.getElementById('add-user-form');
const changePasswordForm = document.getElementById('password-form');
const searchInput = document.getElementById('search-input');
const tableHeaders = document.querySelectorAll('#user-table thead th');


function createUserRow(user) {
  const tr = document.createElement('tr');
  const adminStatus = user.is_admin === 1 ? 'Yes' : 'No';

  tr.innerHTML =  `
       <td>${user.name}</td>
       <td>${user.email}</td>
       <td>${adminStatus}</td>
       <td>
         <button class="edit-btn" data-id="${user.id}">Edit</button>
         <button class="delete-btn" data-id="${user.id}">Delete</button>

       </td>
        `;



       return tr;



}

function renderTable(userArray) {
  userTableBody.innerHTML = '';

  userArray.forEach(user => {
    const row = createUserRow(user);
    userTableBody.appendChild(row);
  
    
  });

}


function handleChangePassword(event) {
  event.preventDefault();

  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if(newPassword !==confirmPassword) {
    alert('Passwords do not match.');
    return;

  }

  if (newPassword.length <8) {
    alert('Password must be at least 8 characters.')
    return;
  }

const data = {
    id: 1,
    current_password: currentPassword,
    new_password: newPassword
};

  fetch('./api/index.php?action=change_password',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'

    },
     body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(result=>{
    if (result.success){
      alert('Password updated successfully!');
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
    }
    else{
      alert(result.message || 'Failed to update password');

    }

  })

  .catch(error => {
    console.error('Change password error:', error);
    displayMessage('An error occurred. Please try again.', 'error');
  });


}



function handleAddUser(event) {
  event.preventDefault();

  const name = document.getElementById('user-name').value;
  const email = document.getElementById('user-email') .value;
  const password = document.getElementById('default-password') .value;
  const isAdmin = document.getElementById('is-admin').value;

  if (!name || !email || !password){

    alert('Please fill out all required fields.');
    return;

  }

  if (password.length<8) {
    alert('Password must be at least 8 characters')
    return;

  }

  const data = {
    name:name,
    email: email,
    password: password,
    is_admin: parseInt(isAdmin)
  };

  fetch('../api/index.php',{
    method:'POST',
    headers: {
      'Content-Type':'application/json'
    },

    body: JSON.stringify(data)

  })
  .then(response => response.json())
  .then(result=>{
    if (result.success){
      loadUsersAndInitialize();
            document.getElementById('user-name').value = '';
            document.getElementById('user-email').value = '';
            document.getElementById('default-password').value = '';
            document.getElementById('is-admin').value = '0';

    }
    else{
      alert(result.message || 'Failed to add user');

    }
  })

 .catch(error => {
    console.error('Add user error:', error);
    displayMessage('An error occurred. Please try again.', 'error');

  });

}


function handleTableClick(event) {
  const target = event.target;

  if(target.classList.contains('delete-btn')){
    const id =  target.getAttribute('data-id');

    if(confirm('Are you sure you want to delete this user?')){

      fetch(`../api/index.php?id=${id}`,{
        method: 'DELETE'

      })

      .then(response=> response.json())

      .then(result => {

        if(result.success) {

             users = users.filter(user => user.id != id);
             renderTable(users);

        }

        else{

          alert(result.message || 'Failed to delete user' );

        }

      })
      .catch(error =>{

        console.error('Error:', error);
        alert('An error occurred');

      });
    }
  }
  if(target.classList.contains('edit-btn')){

    const id = target.getAttribute('data-id');
    alert ('Edit functionality coming soon');

  }
}


function handleSearch(event) {
  const searchTerm = searchInput.value.toLowerCase();

  if(searchTerm ===''){
    renderTable(users);
    return;

  }

  const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm) || 
        user.email.toLowerCase().includes(searchTerm)
    );

    renderTable(filtered);

}

function handleSort(event) {
  const th = event.currentTarget;
  const cellIndex = th.cellIndex;

  let sortField = '';
  if(cellIndex === 0) sortField = 'name';
  if(cellIndex === 1) sortField = 'email';
  if(cellIndex === 2) sortField = 'is_admin';

  if(!sortField) return;

  let sortDir = th.getAttribute('data-sort-dir') || 'asc';
  
  users.sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'name' || sortField === 'email') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    } else {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
  });

  let nextDir = sortDir === 'asc' ? 'desc' : 'asc';
  th.setAttribute('data-sort-dir', nextDir);

  renderTable(users);
}


 
async function loadUsersAndInitialize() {

  try{
    const response = await fetch('./api/index.php');
    if(!response.ok){
      throw new Error('Failed to load users');

    }
    const data = await response.json();

    if(data.success){
      users = data.data;
      renderTable(users);

      changePasswordForm.addEventListener('submit', handleChangePassword);
      addUserForm.addEventListener('submit', handleAddUser);
      userTableBody.addEventListener('click', handleTableClick);
      searchInput.addEventListener('input', handleSearch);

      tableHeaders.forEach(th =>{
        th.addEventListener('click', handleSort);

    });

    }
    else{
      console.error('Error loading users:', data.message);
      alert('Failed to load users');
    }
  }
  catch(error){
    console.error('Error:', error);
    alert('An error occurred while loading users');
  }
  }


// --- Initial Page Load ---
loadUsersAndInitialize();
