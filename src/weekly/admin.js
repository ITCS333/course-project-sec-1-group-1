let weeks = [];

const weekForm = document.getElementById('week-form');

const weeksTbody = document.getElementById('weeks-tbody');


function createWeekRow(week) {
  const tr = document.createElement('tr');

  const titleTd = document.createElement('td');
  titleTd.textContent = week.title;

  const dateTd = document.createElement('td');
  dateTd.textContent = week.start_date;

  const descTd = document.createElement('td');
  descTd.textContent = week.description;

  const actionsTd = document.createElement('td');

  const editBtn = document.createElement('button');
  editBtn.className = 'edit-btn';
  editBtn.dataset.id = week.id;
  editBtn.textContent = 'Edit';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.dataset.id = week.id;
  deleteBtn.textContent = 'Delete';

  actionsTd.appendChild(editBtn);
  actionsTd.appendChild(deleteBtn);

  tr.appendChild(titleTd);
  tr.appendChild(dateTd);
  tr.appendChild(descTd);
  tr.appendChild(actionsTd);

  return tr;
}

function renderTable() {
  weeksTbody.innerHTML = '';

  weeks.forEach(week => {
    const row = createWeekRow(week);
    weeksTbody.appendChild(row);
  });
}

async function handleAddWeek(event) {
  event.preventDefault();

  const title       = document.getElementById('week-title').value.trim();
  const start_date  = document.getElementById('week-start-date').value;
  const description = document.getElementById('week-description').value.trim();
  const links       = document.getElementById('week-links').value
                        .split('\n')
                        .map(link => link.trim())
                        .filter(link => link !== '');

  const addBtn = document.getElementById('add-week');

  if (addBtn.dataset.editId) {
    const id = parseInt(addBtn.dataset.editId, 10);
    await handleUpdateWeek(id, { title, start_date, description, links });
    return;
  }

  try {
    const response = await fetch('./api/index.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, start_date, description, links }),
    });

    const result = await response.json();

    if (result.success === true) {
      weeks.push({
        id: result.id,
        title,
        start_date,
        description,
        links,
      });

      renderTable();
      weekForm.reset();
    } else {
      console.error('Failed to add week:', result);
    }
  } catch (error) {
    console.error('Error adding week:', error);
  }
}

async function handleUpdateWeek(id, fields) {
  try {
    const response = await fetch('./api/index.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...fields }),
    });

    const result = await response.json();

    if (result.success === true) {
      const index = weeks.findIndex(w => w.id === id);
      if (index !== -1) {
        weeks[index] = { id, ...fields };
      }

      renderTable();
      weekForm.reset();

      const addBtn = document.getElementById('add-week');
      addBtn.textContent = 'Add Week';
      delete addBtn.dataset.editId;
    } else {
      console.error('Failed to update week:', result);
    }
  } catch (error) {
    console.error('Error updating week:', error);
  }
}

async function handleTableClick(event) {
  const target = event.target;

  if (target.classList.contains('delete-btn')) {
    const id = parseInt(target.dataset.id, 10);

    try {
      const response = await fetch(`./api/index.php?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success === true) {
        weeks = weeks.filter(w => w.id !== id);
        renderTable();
      } else {
        console.error('Failed to delete week:', result);
      }
    } catch (error) {
      console.error('Error deleting week:', error);
    }
  }

  if (target.classList.contains('edit-btn')) {
    const id = parseInt(target.dataset.id, 10);

    const week = weeks.find(w => w.id === id);
    if (!week) return;

    document.getElementById('week-title').value       = week.title;
    document.getElementById('week-start-date').value  = week.start_date;
    document.getElementById('week-description').value = week.description;
    document.getElementById('week-links').value       = week.links.join('\n');

    const addBtn = document.getElementById('add-week');
    addBtn.textContent = 'Update Week';
    addBtn.dataset.editId = week.id;

    weekForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

async function loadAndInitialize() {
  try {
    const response = await fetch('./api/index.php', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    if (result.success === true) {
      weeks = result.data;

      renderTable();
    } else {
      console.error('Failed to load weeks:', result);
    }
  } catch (error) {
    console.error('Error loading weeks:', error);
  }

  weekForm.addEventListener('submit', handleAddWeek);

  weeksTbody.addEventListener('click', handleTableClick);
}

loadAndInitialize();
