const serverUrl = 'https://jsonplaceholder.typicode.com/posts'; // Simulated server URL
let quotes = []; // The array to store quotes (local + server)

// Fetch quotes from the server and sync with local storage
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(serverUrl);
    const serverQuotes = await response.json();
    
    // Handle conflicts and sync
    resolveConflicts(serverQuotes);

    // Merge server data with local data and remove duplicates
    quotes = [...new Set([...serverQuotes, ...quotes])];
    saveQuotes();
    populateCategories();
    filterQuotes();
  } catch (error) {
    console.error('Error fetching quotes from server:', error);
  }
}

// Post a new quote to the server
async function postQuoteToServer(quote) {
  try {
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quote),
    });
    const data = await response.json();
    console.log('Posted quote to server:', data);
  } catch (error) {
    console.error('Error posting quote to server:', error);
  }
}
// Function to add a new quote
function addQuote() {
  const newQuoteText = document.getElementById('newQuoteText').value.trim();
  const newQuoteCategory = document.getElementById('newQuoteCategory').value.trim();

  if (newQuoteText && newQuoteCategory) {
    const newQuote = { text: newQuoteText, category: newQuoteCategory };
    quotes.push(newQuote); // Add new quote to the local array

    // Save to localStorage
    saveQuotes();

    // Post new quote to the server
    postQuoteToServer(newQuote);

    // Update the UI
    populateCategories();
    filterQuotes();
  } else {
    alert('Please enter both a quote and a category.');
  }

  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
}
// Resolve conflicts between server and local data
function resolveConflicts(serverQuotes) {
  let conflictResolved = false;

  serverQuotes.forEach(serverQuote => {
    const matchingLocalQuote = quotes.find(localQuote => localQuote.text === serverQuote.text);
    
    if (!matchingLocalQuote) {
      quotes.push(serverQuote); // Add server quote if not found locally
      conflictResolved = true;
    }
  });

  if (conflictResolved) {
    alert('Data conflict detected and resolved. Server data has been prioritized.');
    saveQuotes();
  }
}
// Periodic sync with server
function startDataSync() {
  setInterval(fetchQuotesFromServer, 600000); // Sync every 10 minutes
}

// Initialize sync and fetch on page load
window.onload = function() {
  fetchQuotesFromServer(); // Initial fetch
  startDataSync(); // Start periodic syncing
  populateCategories();
  filterQuotes();
};
// Save quotes to local storage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Load quotes from local storage
function loadQuotes() {
  const storedQuotes = localStorage.getItem('quotes');
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  }
}
// Populate categories in the dropdown
function populateCategories() {
  const categoryFilter = document.getElementById('categoryFilter');
  const categories = [...new Set(quotes.map(quote => quote.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

// Filter quotes based on selected category
function filterQuotes() {
  const selectedCategory = document.getElementById('categoryFilter').value;
  const quoteDisplay = document.getElementById('quoteDisplay');
  quoteDisplay.innerHTML = ''; // Clear current quotes

  const filteredQuotes = selectedCategory === 'all' ? quotes : quotes.filter(quote => quote.category === selectedCategory);

  filteredQuotes.forEach(quote => {
    const quoteElement = document.createElement('div');
    quoteElement.className = 'quote';
    quoteElement.textContent = `"${quote.text}" - ${quote.category}`;
    quoteDisplay.appendChild(quoteElement);
  });
}
// Function to sync local quotes with server quotes
async function syncQuotes() {
  try {
    // Fetch local quotes from localStorage
    const localQuotes = JSON.parse(localStorage.getItem('quotes')) || [];

    // Fetch quotes from the server
    const response = await fetch(serverUrl);
    const serverQuotes = await response.json();

    // Resolve conflicts: prioritize server data
    let hasConflict = false;
    const mergedQuotes = [...localQuotes]; // Start with local quotes

    serverQuotes.forEach(serverQuote => {
      const matchingLocalQuote = localQuotes.find(localQuote => localQuote.text === serverQuote.text);

      if (!matchingLocalQuote) {
        mergedQuotes.push(serverQuote); // Add server quote if it's not found locally
        hasConflict = true;
      }
    });

    // If there was a conflict, notify the user and save merged quotes to localStorage
    if (hasConflict) {
      alert('Conflict detected and resolved. Server data was prioritized.');
      localStorage.setItem('quotes', JSON.stringify(mergedQuotes));
    }

    // Update the local quotes array
    quotes = mergedQuotes;
    populateCategories();
    filterQuotes();
  } catch (error) {
    console.error('Error syncing quotes:', error);
  }
}
// Initialize sync on page load
window.onload = function() {
  syncQuotes(); // Initial sync
  startDataSync(); // Start periodic syncing every 10 minutes
  populateCategories();
  filterQuotes();
};

// Periodic sync with server (every 10 minutes)
function startDataSync() {
  setInterval(syncQuotes, 600000); // Sync every 10 minutes (600000 ms)
}
// Notify user or log when sync is successful
    notifyUser('Quotes synced with server!');
  } catch (error) {
    console.error('Error syncing quotes with server:', error);
  }
}
