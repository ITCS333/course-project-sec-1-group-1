let currentTopicId = null;
let currentReplies = [];

const topicSubject = document.getElementById('topic-subject');
const opMessage = document.getElementById('op-message');
const opFooter = document.getElementById('op-footer');
const replyListContainer = document.getElementById('reply-list-container');
const replyForm = document.getElementById('reply-form');
const newReplyText = document.getElementById('new-reply');

function getTopicIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderOriginalPost(topic) {
  topicSubject.textContent = topic.subject;
  opMessage.textContent = topic.message;
  opFooter.textContent = "Posted by: " + topic.author + " on " + topic.created_at;
}

function createReplyArticle(reply) {
  const article = document.createElement('article');
  article.innerHTML = `
    <p>${reply.text}</p>
    <footer>Posted by: ${reply.author} on ${reply.created_at}</footer>
    <div>
      <button class="delete-reply-btn" data-id="${reply.id}">Delete</button>
    </div>
  `;
  return article;
}

function renderReplies() {
  replyListContainer.innerHTML = "";
  currentReplies.forEach(reply => {
    replyListContainer.appendChild(createReplyArticle(reply));
  });
}

async function handleAddReply(event) {
  event.preventDefault();
  const replyText = newReplyText.value.trim();
  if (!replyText) return;

  const response = await fetch('./api/index.php?action=reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic_id: parseInt(currentTopicId),
      author: "Student",
      text: replyText
    })
  });

  const result = await response.json();
  if (result.success) {
    currentReplies.push(result.data);
    renderReplies();
    newReplyText.value = "";
  }
}

async function handleReplyListClick(event) {
  if (event.target.classList.contains("delete-reply-btn")) {
    const id = event.target.dataset.id;
    const response = await fetch(`./api/index.php?action=delete_reply&id=${id}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    if (result.success) {
      currentReplies = currentReplies.filter(r => r.id != id);
      renderReplies();
    }
  }
}

async function initializePage() {
  currentTopicId = getTopicIdFromURL();
  
  if (!currentTopicId) {
    if (topicSubject) topicSubject.textContent = "Topic not found.";
    return;
  }

  try {
    const [topicRes, replyRes] = await Promise.all([
      fetch(`./api/index.php?id=${currentTopicId}`),
      fetch(`./api/index.php?action=replies&topic_id=${currentTopicId}`)
    ]);

    const topicResult = await topicRes.json();
    const replyResult = await replyRes.json();

    if (topicResult.success) {
      renderOriginalPost(topicResult.data);
      currentReplies = replyResult.data || [];
      renderReplies();

      if (replyForm) replyForm.addEventListener('submit', handleAddReply);
      if (replyListContainer) replyListContainer.addEventListener('click', handleReplyListClick);
    } else {
      topicSubject.textContent = "Topic not found.";
    }
  } catch (error) {
    console.error(error);
  }
}

initializePage();
