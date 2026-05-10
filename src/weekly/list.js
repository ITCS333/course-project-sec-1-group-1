const weekListSection = document.getElementById('week-list-section');


function createWeekArticle(week) {
  const article = document.createElement('article');

  const h2 = document.createElement('h2');
  h2.textContent = week.title;

  const startDate = document.createElement('p');
  startDate.textContent = 'Starts on: ' + week.start_date;

  const description = document.createElement('p');
  description.textContent = week.description;

  const link = document.createElement('a');
  link.href        = 'details.html?id=' + week.id;
  link.textContent = 'View Details & Discussion';

  article.appendChild(h2);
  article.appendChild(startDate);
  article.appendChild(description);
  article.appendChild(link);

  return article;
}

async function loadWeeks() {
  try {
    const response = await fetch('./api/index.php');
    const result   = await response.json();

    weekListSection.innerHTML = '';

    if (result.success === true && Array.isArray(result.data)) {
      result.data.forEach(week => {
        const article = createWeekArticle(week);
        weekListSection.appendChild(article);
      });
    } else {
      console.error('Failed to load weeks:', result);
    }
  } catch (error) {
    console.error('Error loading weeks:', error);
  }
}

loadWeeks();
