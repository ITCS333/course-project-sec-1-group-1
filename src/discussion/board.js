let currentTopic = null;
let replies = [];

const opContainer = document.getElementById('original-post-container');
const replyListContainer = document.getElementById('reply-list-container');
const replyForm = document.getElementById('new-reply-form');

function getTopicIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderOriginalPost() {
  if (!currentTopic) return;
  document.getElementById('op-subject').innerText = currentTopic.subject;
  document.getElementById('op-message').innerText = currentTopic.message;
  document.getElementById('op-footer').innerText = `Posted by: ${currentTopic.author} on ${currentTopic.created_at}`;
}

function createReplyArticle(reply) {
  const article = document.createElement('article');
  article.innerHTML = `
    <p>${reply.reply_text}</p>
    <footer>Posted by: ${reply.author} on ${reply.created_at}</footer>
    <button class="delete-reply-btn" data-id="${reply.id}">Delete</button>
  `;
  return article;
}

function renderReplies() {
  replyListContainer.innerHTML = "";
  replies.forEach(reply => {
    const article = createReplyArticle(reply);
    replyListContainer.appendChild(article);
  });
}

async function handleAddReply(event) {
  event.preventDefault();
  const topicId = getTopicIdFromURL();
  const textarea = document.getElementById('reply-text');
  const replyText = textarea.value.trim();

  if (!replyText) return;

  const response = await fetch(`./api/index.php?action=reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic_id: parseInt(topicId),
      reply_text: replyText,
      author: "Student"
    })
  });

  const result = await response.json();
  if (result.success) {
    replies.push({
      id: result.id,
      reply_text: replyText,
      author: "Student",
      created_at: result.created_at || new Date().toISOString().slice(0, 19).replace('T', ' ')
    });
    renderReplies();
    textarea.value = "";
  }
}

async function handleReplyListClick(event) {
  if (event.target.classList.contains("delete-reply-btn")) {
    const id = event.target.dataset.id;
    const response = await fetch(`./api/index.php?id=${id}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    if (result.success) {
      replies = replies.filter(r => r.id != id);
      renderReplies();
    }
  }
}

async function initializePage() {
  const topicId = getTopicIdFromURL();
  if (!topicId) return;

  const topicRes = await fetch(`./api/index.php?id=${topicId}`);
  const topicData = await topicRes.json();
  if (topicData.success) {
    currentTopic = topicData.data;
    renderOriginalPost();
  }

  const replyRes = await fetch(`./api/index.php?action=replies&topic_id=${topicId}`);
  const replyData = await replyRes.json();
  if (replyData.success) {
    replies = replyData.data;
    renderReplies();
  }

  replyForm.addEventListener('submit', handleAddReply);
  replyListContainer.addEventListener('click', handleReplyListClick);
}

initializePage();
