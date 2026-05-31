const resourceListSection = document.querySelector('#resource-list-section');
 

function createResourceArticle(resource) {
  const { id, title, description, link } = resource;
 
  const article = document.createElement('article');
  article.innerHTML = `
    <h2>${title}</h2>
    <p>${description || ''}</p>
    <a href="details.html?id=${id}">View Resource &amp; Discussion</a>
  `;
  return article;
}

async function loadResources() {
  try {
    const res  = await fetch('./api/index.php');
    const data = await res.json();
 
    if (data.success) {
      resourceListSection.innerHTML = '';
 
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
// Call the function to populate the page.
loadResources();
