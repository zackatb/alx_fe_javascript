const API_URL = "https://jsonplaceholder.typicode.com/posts"; // Mock API for quotes
let quotes = JSON.parse(localStorage.getItem("quotes")) || [];

// Function to show a random quote
function showRandomQuote() {
  if (quotes.length === 0) {
    alert("No quotes available. Please add some!");
    return;
  }
  const randomIndex = Math.floor(Math.random() * quotes.length);
  document.getElementById("quoteDisplay").innerText = quotes[randomIndex].text;
}

// Function to create the add quote form
function createAddQuoteForm() {
  const formContainer = document.createElement("div");
  formContainer.innerHTML = `
    <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
    <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
    <button id="addQuoteButton">Add Quote</button>
  `;
  document.body.appendChild(formContainer);

  // Event listener for adding a new quote
  document.getElementById("addQuoteButton").addEventListener("click", addQuote);
}

// Function to add a quote
function addQuote() {
  const quoteText = document.getElementById("newQuoteText").value;
  const quoteCategory = document.getElementById("newQuoteCategory").value;

  if (quoteText === "" || quoteCategory === "") {
    alert("Please fill out both fields.");
    return;
  }

  const newQuote = { text: quoteText, category: quoteCategory };
  quotes.push(newQuote);
  saveQuotes();
  notifyUser("Quote added successfully!");
  populateCategories();
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  
  // Post the new quote to the server
  postQuoteToServer(newQuote);
}

// Function to save quotes to local storage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Function to populate categories in the dropdown
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const uniqueCategories = [...new Set(quotes.map(q => q.category))];

  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  uniqueCategories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

// Function to filter quotes based on selected category
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  const filteredQuotes = selectedCategory === "all" ? quotes : quotes.filter(q => q.category === selectedCategory);
  
  const quoteDisplay = document.getElementById("quoteDisplay");
  quoteDisplay.innerHTML = filteredQuotes.length > 0 ? filteredQuotes.map(q => `<div>${q.text}</div>`).join("") : "No quotes found.";
}

// Function to export quotes to JSON
function exportQuotesToJson() {
  const dataStr = JSON.stringify(quotes);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Function to import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    const importedQuotes = JSON.parse(event.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    notifyUser("Quotes imported successfully!");
    populateCategories();
    filterQuotes();
  };
  fileReader.readAsText(event.target.files[0]);
}

// Function to notify the user
function notifyUser(message) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.className = "notification"; // Add a class for styling
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000); // Remove after 5 seconds
}

// Function to fetch quotes from the server
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(API_URL);
    const serverQuotes = await response.json();
    return serverQuotes.map(q => ({ text: q.title, category: "General" })); // Assuming category can be General
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return [];
  }
}

// Function to post a new quote to the server
async function postQuoteToServer(quote) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(quote)
    });

    if (!response.ok) {
      throw new Error("Failed to post quote to the server");
    }
    
    const serverResponse = await response.json();
    console.log("Quote posted successfully:", serverResponse);
  } catch (error) {
    console.error('Error posting quote:', error);
  }
}

// Function to sync quotes with the server
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();

  const localQuotes = JSON.parse(localStorage.getItem("quotes")) || [];
  
  serverQuotes.forEach(serverQuote => {
    const existingQuote = localQuotes.find(localQuote => localQuote.text === serverQuote.title);
    if (!existingQuote) {
      localQuotes.push({ text: serverQuote.title, category: "General" }); // Add new quote from server
      notifyUser(`Added new quote from server: "${serverQuote.title}"`);
    } else {
      // Conflict handling
      const userChoice = confirm(`Conflict detected for quote: "${existingQuote.text}". 
      Click OK to update to server's version, Cancel to keep local version.`);
      
      if (userChoice) {
        existingQuote.category = "General"; // Update local quote with server's category
        notifyUser(`Updated "${existingQuote.text}" with server's version.`);
      }
    }
  });

  // Update local storage with the merged quotes
  localStorage.setItem("quotes", JSON.stringify(localQuotes));
  quotes = localQuotes; // Update the quotes variable to the new local quotes
  filterQuotes(); // Update the displayed quotes

  notifyUser("Quotes synced with server!");
}

// Periodically check for new quotes from the server
setInterval(syncQuotes, 60000); // Check every 60 seconds

// Initial setup
document.addEventListener("DOMContentLoaded", () => {
  createAddQuoteForm(); // Create the form to add quotes
  populateCategories();
  showRandomQuote();
  syncQuotes(); // Sync quotes on page load
});