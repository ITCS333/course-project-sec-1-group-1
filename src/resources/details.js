const params     = new URLSearchParams(window.location.search);
const resourceId = params.get('id');
 

const titleEl       = document.getElementById('resource-title');
const descriptionEl = document.getElementById('resource-description');
const linkEl        = document.getElementById('resource-link');
const commentList   = document.getElementById('comment-list');
const commentForm   = document.getElementById('comment-form');
 
function createCommentArticle(comment) {
  const article = document.createElement('article');
  article.innerHTML = `
    <p>${comment.text}</p>
    <footer>Posted by: ${comment.author}</footer>
  `;
  return article;
}
 
function renderComments(comments) {
  commentList.innerHTML = '';
  if (comments.length === 0) {
    commentList.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
    return;
  }
  comments.forEach(comment => {
    commentList.appendChild(createCommentArticle(comment));
  });
}
 
async function loadResource() {
  if (!resourceId) {
    titleEl.textContent = 'Resource not found.';
    return;
  }
 
  try {
    const res  = await fetch(`./api/index.php?id=${resourceId}`);
    const data = await res.json();
 
    if (data.success) {
      const resource          = data.data;
      titleEl.textContent     = resource.title;
      descriptionEl.textContent = resource.description || '';
      linkEl.href             = resource.link;
      document.title          = resource.title;
    } else {
      titleEl.textContent = 'Resource not found.';
    }
  } catch (err) {
    console.error('Error loading resource:', err);
    titleEl.textContent = 'Error loading resource.';
  }
}
 
async function loadComments() {
  if (!resourceId) return;
 
  try {
    const res  = await fetch(`./api/index.php?resource_id=${resourceId}&action=comments`);
    const data = await res.json();
 
    if (data.success) {
      renderComments(data.data);
    }
  } catch (err) {
    console.error('Error loading comments:', err);
  }
}
 
async function handleCommentSubmit(event) {
  event.preventDefault();
 
  const author = document.getElementById('comment-author').value.trim();
  const text   = document.getElementById('new-comment').value.trim();
 
  if (!author || !text) return;
 
  try {
    const res  = await fetch('./api/index.php?action=comment', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ resource_id: Number(resourceId), author, text }),
    });
    const data = await res.json();
 
    if (data.success) {
      commentForm.reset();
      await loadComments(); 
    } else {
      alert(data.message || 'Failed to post comment.');
    }
  } catch (err) {
    console.error('Error posting comment:', err);
    alert('An error occurred. Please try again.');
  }
}
 
loadResource();
loadComments();
commentForm.addEventListener('submit', handleCommentSubmit);