let currentWeekId   = null;
let currentComments = [];

const weekTitle       = document.getElementById('week-title');
const weekStartDate   = document.getElementById('week-start-date');
const weekDescription = document.getElementById('week-description');
const weekLinksList   = document.getElementById('week-links-list');
const commentList     = document.getElementById('comment-list');
const commentForm     = document.getElementById('comment-form');
const newCommentInput = document.getElementById('new-comment');

function getWeekIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderWeekDetails(week) {
  weekTitle.textContent = week.title;

  weekStartDate.textContent = 'Starts on: ' + week.start_date;

  weekDescription.textContent = week.description;

  weekLinksList.innerHTML = '';
  week.links.forEach(url => {
    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.href        = url;
    a.textContent = url;
    a.target      = '_blank';
    a.rel         = 'noopener noreferrer';
    li.appendChild(a);
    weekLinksList.appendChild(li);
  });
}

function createCommentArticle(comment) {
  const article = document.createElement('article');

  const p = document.createElement('p');
  p.textContent = comment.text;

  const footer = document.createElement('footer');
  footer.textContent = 'Posted by: ' + comment.author;

  article.appendChild(p);
  article.appendChild(footer);

  return article;
}

function renderComments() {
  commentList.innerHTML = '';

  currentComments.forEach(comment => {
    const article = createCommentArticle(comment);
    commentList.appendChild(article);
  });
}

async function handleAddComment(event) {
  event.preventDefault();

  const commentText = newCommentInput.value.trim();

  if (!commentText) return;

  try {
    const response = await fetch('./api/index.php?action=comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        week_id: currentWeekId,
        author:  'Student',
        text:    commentText,
      }),
    });

    const result = await response.json();

    if (result.success === true) {
      currentComments.push(result.data);

      renderComments();

      newCommentInput.value = '';
    } else {
      console.error('Failed to post comment:', result);
    }
  } catch (error) {
    console.error('Error posting comment:', error);
  }
}

async function initializePage() {
  currentWeekId = getWeekIdFromURL();

  if (!currentWeekId) {
    weekTitle.textContent = 'Week not found.';
    return;
  }

  try {
    const [weekResponse, commentsResponse] = await Promise.all([
      fetch(`./api/index.php?id=${currentWeekId}`),
      fetch(`./api/index.php?action=comments&week_id=${currentWeekId}`),
    ]);

    const weekResult     = await weekResponse.json();
    const commentsResult = await commentsResponse.json();

    currentComments = (commentsResult.success && Array.isArray(commentsResult.data))
      ? commentsResult.data
      : [];

    if (weekResult.success === true && weekResult.data) {
      renderWeekDetails(weekResult.data);
      renderComments();
      commentForm.addEventListener('submit', handleAddComment);
    } else {
      weekTitle.textContent = 'Week not found.';
    }
  } catch (error) {
    console.error('Error initializing page:', error);
    weekTitle.textContent = 'Week not found.';
  }
}

initializePage();
