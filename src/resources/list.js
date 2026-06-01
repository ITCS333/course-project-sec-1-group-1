/*
  list.js — Course Resources list page logic
*/
 
// --- Element Selections ---
const resourceListSection = document.querySelector('#resource-list-section');
 
// --- Functions ---
 
/**
 * createResourceArticle
 * Returns an <article> element for one resource object.
 */
function createResourceArticle(resource) {
  const { id, title, description } = resource;
 
  const article = document.createElement('article');
 
  const h2 = document.createElement('h2');
  h2.textContent = title;
 
  const p = document.createElement('p');
  p.textContent = description || '';
 
  const a = document.createElement('a');
  a.href        = `details.html?id=${id}`;
  a.textContent = 'View Resource & Discussion';
 
  article.appendChild(h2);
  article.appendChild(p);
  article.appendChild(a);
 
  return article;
}
 
/**
 * loadResources
 * Fetches all resources from the API and renders them.
 */
async function loadResources() {
  try {
    const res  = await fetch('./api/index.php');
    const data = await res.json();
 
    resourceListSection.innerHTML = '';
 
    if (data.success) {
      if (data.data.length === 0) {
        resourceListSection.innerHTML = '<p>No resources available yet.</p>';
        return;
      }
      data.data.forEach(resource => {
        resourceListSection.appendChild(createResourceArticle(resource));
      });
    } else {
      resourceListSection.innerHTML = '<p>Failed to load resources.</p>';
    }
  } catch (err) {
    console.error('Error loading resources:', err);
    resourceListSection.innerHTML = '<p>An error occurred. Please try again later.</p>';
  }
}
 
// --- Initial Page Load ---
loadResources();
 