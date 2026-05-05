let topics = [];

const newTopicForm = document.getElementById('new-topic-form');
const topicListContainer = document.getElementById('topic-list-container');

function createTopicArticle(topic) {
  const article = document.createElement('article');
  article.innerHTML = `
    <h3><a href="topic.html?id=${topic.id}">${topic.subject}</a></h3>
    <footer>Posted by: ${topic.author} on ${topic.created_at}</footer>
    <div>
      <button class="edit-btn" data-id="${topic.id}">Edit</button>
      <button class="delete-btn" data-id="${topic.id}">Delete</button>
    </div>
  `;
  return article;
}

function renderTopics() {
  topicListContainer.innerHTML = "";
  topics.forEach(topic => {
    const article = createTopicArticle(topic);
    topicListContainer.appendChild(article);
  });
}

async function handleCreateTopic(event) {
  event.preventDefault();

  const subjectInput = document.getElementById('topic-subject');
  const messageInput = document.getElementById('topic-message');
  const submitBtn = document.getElementById('create-topic');

  const subject = subjectInput.value;
  const message = messageInput.value;

  if (submitBtn.innerText === "Update Topic") {
    const id = submitBtn.dataset.editId;
    await handleUpdateTopic(id, { subject, message });
    submitBtn.innerText = "Create Topic";
    delete submitBtn.dataset.editId;
    newTopicForm.reset();
    return;
  }

  const response = await fetch('./api/index.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, message, author: "Student" })
  });

  const result = await response.json();
  if (result.success) {
    topics.push({
      id: result.id,
      subject: subject,
      message: message,
      author: "Student",
      created_at: result.created_at || new Date().toISOString().slice(0, 19).replace('T', ' ')
    });
    renderTopics();
    newTopicForm.reset();
  }
}

async function handleUpdateTopic(id, fields) {
  const response = await fetch('./api/index.php', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: parseInt(id), ...fields })
  });

  const result = await response.json();
  if (result.success) {
    const index = topics.findIndex(t => t.id == id);
    if (index !== -1) {
      topics[index].subject = fields.subject;
      topics[index].message = fields.message;
      renderTopics();
    }
  }
}

async function handleTopicListClick(event) {
  const id = event.target.dataset.id;

  if (event.target.classList.contains("delete-btn")) {
    const response = await fetch(`./api/index.php?id=${id}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    if (result.success) {
      topics = topics.filter(t => t.id != id);
      renderTopics();
    }
  } 
  else if (event.target.classList.contains("edit-btn")) {
    const topic = topics.find(t => t.id == id);
    if (topic) {
      document.getElementById('topic-subject').value = topic.subject;
      document.getElementById('topic-message').value = topic.message;
      const submitBtn = document.getElementById('create-topic');
      submitBtn.innerText = "Update Topic";
      submitBtn.dataset.editId = id;
    }
  }
}

async function loadAndInitialize() {
  try {
    const response = await fetch('./api/index.php');
    const result = await response.json();
    
    if (result.success) {
      topics = result.data;
      renderTopics();
    }

    newTopicForm.addEventListener('submit', handleCreateTopic);
    topicListContainer.addEventListener('click', handleTopicListClick);
    
  } catch (error) {
    console.error(error);
  }
}

loadAndInitialize();
