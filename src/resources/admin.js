let resources = [];
 
const resourceForm  = document.querySelector('#resource-form');
const resourceTbody = document.querySelector('#resources-tbody');
 
function createResourceRow(resource) {
  const { id, title, description, link } = resource;
 
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${title}</td>
    <td>${description || ''}</td>
    <td><a href="${link}" target="_blank">${link}</a></td>
    <td>
      <button class="edit-btn"   data-id="${id}">Edit</button>
      <button class="delete-btn" data-id="${id}">Delete</button>
    </td>
  `;
  return tr;
}
 
function renderTable(data) {
  const rows = Array.isArray(data) ? data : resources;
  resourceTbody.innerHTML = '';
  rows.forEach(resource => {
    resourceTbody.appendChild(createResourceRow(resource));
  });
}
 
function handleAddResource(event) {
  event.preventDefault();
 
  const title       = document.getElementById('resource-title').value.trim();
  const description = document.getElementById('resource-description').value.trim();
  const link        = document.getElementById('resource-link').value.trim();
 
  fetch('./api/index.php', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ title, description, link }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        resources.push({ id: data.id, title, description, link });
        renderTable();
        resourceForm.reset();
      } else {
        alert(data.message || 'Failed to add resource.');
      }
    })
    .catch(err => {
      console.error('Error adding resource:', err);
      alert('An error occurred. Please try again.');
    });
}
 
function handleTableClick(event) {
  const target = event.target;
 
  if (target.classList.contains('delete-btn')) {
    const id = target.getAttribute('data-id');
 
    fetch(`./api/index.php?id=${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          resources = resources.filter(r => String(r.id) !== String(id));
          renderTable();
        } else {
          alert(data.message || 'Failed to delete resource.');
        }
      })
      .catch(err => {
        console.error('Error deleting resource:', err);
        alert('An error occurred. Please try again.');
      });
  }
 
  if (target.classList.contains('edit-btn')) {
    const id       = target.getAttribute('data-id');
    const resource = resources.find(r => String(r.id) === String(id));
    if (!resource) return;
 
    document.getElementById('resource-title').value       = resource.title;
    document.getElementById('resource-description').value = resource.description || '';
    document.getElementById('resource-link').value        = resource.link;
 
    const submitBtn = document.getElementById('add-resource');
    submitBtn.textContent = 'Update Resource';
 
    const updateHandler = function (event) {
      event.preventDefault();
 
      const title       = document.getElementById('resource-title').value.trim();
      const description = document.getElementById('resource-description').value.trim();
      const link        = document.getElementById('resource-link').value.trim();
 
      fetch('./api/index.php', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: Number(id), title, description, link }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const index = resources.findIndex(r => String(r.id) === String(id));
            if (index !== -1) {
              resources[index] = { id: Number(id), title, description, link };
            }
            renderTable();
            resourceForm.reset();
            submitBtn.textContent = 'Add Resource';
            resourceForm.removeEventListener('submit', updateHandler);
            resourceForm.addEventListener('submit', handleAddResource);
          } else {
            alert(data.message || 'Failed to update resource.');
          }
        })
        .catch(err => {
          console.error('Error updating resource:', err);
          alert('An error occurred. Please try again.');
        });
    };
 
    resourceForm.removeEventListener('submit', handleAddResource);
    resourceForm.addEventListener('submit', updateHandler);
  }
}
 
async function loadAndInitialize() {
  try {
    const res  = await fetch('./api/index.php');
    const data = await res.json();
 
    if (data.success) {
      resources = data.data;
      renderTable();
    } else {
      console.error('Failed to load resources:', data.message);
    }
  } catch (err) {
    console.error('Error loading resources:', err);
  }
 
  resourceForm.addEventListener('submit', handleAddResource);
  resourceTbody.addEventListener('click', handleTableClick);
}

// --- Initial Page Load ---
// Call the main async function to start the application.
loadAndInitialize();
