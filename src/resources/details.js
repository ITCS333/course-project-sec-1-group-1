/*
  details.js — Course Resource detail page logic
*/
 
// --- Element Selections ---
const titleEl       = document.getElementById('resource-title');
const descriptionEl = document.getElementById('resource-description');
const linkEl        = document.getElementById('resource-link');
const commentList   = document.getElementById('comment-list');
const commentForm   = document.getElementById('comment-form');
 
// --- State ---
let currentComments = [];
 
// --- Functions ---
 
/**
 * getResourceIdFromURL
 * Returns the `id` query parameter from the current URL.
 */
function getResourceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}
 
/**
 * renderResourceDetails
 * Populates the title, description, and link elements with resource data.
 */
function renderResourceDetails(resource) {
  titleEl.textContent       = resource.title;
  descriptionEl.textContent = resource.description || '';
  linkEl.href               = resource.link;
  document.title            = resource.title;
}
 
/**
 * createCommentArticle
 * Returns an <article> element for one comment object.
 */
function createCommentArticle(comment) {
  const article = document.createElement('article');
  article.innerHTML = `
    <p>${comment.text}</p>
    <footer>Posted by: ${comment.author}</footer>
  `;
  return article;
}
 
/**
 * renderComments
 * Clears the comment list and renders one <article> per comment.
 * Accepts an optional array; falls back to the module-level `currentComments`.
 */
function renderComments(data) {
  const list = Array.isArray(data) ? data : currentComments;
  commentList.innerHTML = '';
  if (!list || list.length === 0) {
    commentList.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
    return;
  }
  list.forEach(comment => {
    commentList.appendChild(createCommentArticle(comment));
  });
}
 
/**
 * handleAddComment
 * Handles the comment form submission event.
 */
async function handleAddComment(event) {
  event.preventDefault();
 
  const textarea   = document.getElementById('new-comment');
  const text       = textarea.value.trim();
 
  if (!text) return;
 
  const resourceId = getResourceIdFromURL();
 
  try {
    const res  = await fetch(`./api/index.php?resource_id=${resourceId}&action=comments`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ resource_id: Number(resourceId), text }),
    });
    const data = await res.json();
 
    if (data.success) {
      textarea.value = '';
      await initializePage();
    } else {
      alert(data.message || 'Failed to post comment.');
    }
  } catch (err) {
    console.error('Error posting comment:', err);
    alert('An error occurred. Please try again.');
  }
}
 
/**
 * initializePage
 * Fetches resource details and comments, then renders them.
 */
async function initializePage() {
  const resourceId = getResourceIdFromURL();
 
  if (!resourceId) {
    titleEl.textContent = 'Resource not found.';
    return;
  }
 
  try {
    const res  = await fetch(`./api/index.php?id=${resourceId}`);
    const data = await res.json();
 
    if (data.success) {
      renderResourceDetails(data.data);
    } else {
      titleEl.textContent = 'Resource not found.';
    }
  } catch (err) {
    console.error('Error loading resource:', err);
    titleEl.textContent = 'Error loading resource.';
  }
 
  try {
    const res  = await fetch(`./api/index.php?resource_id=${resourceId}&action=comments`);
    const data = await res.json();
 
    if (data.success) {
      currentComments = data.data;
      renderComments();
    }
  } catch (err) {
    console.error('Error loading comments:', err);
  }
}
 
// --- Initial Page Load ---
initializePage();
commentForm.addEventListener('submit', handleAddComment);
