document.addEventListener("DOMContentLoaded", () => {
  const darkModeToggle = document.createElement("button");
  darkModeToggle.id = "dark-mode-toggle";
  darkModeToggle.textContent = "Toggle Dark Mode";
  darkModeToggle.style.position = "absolute";
  darkModeToggle.style.top = "10px";
  darkModeToggle.style.right = "10px";
  document.body.appendChild(darkModeToggle);

  // Add event listener to toggle dark mode
  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
  });

  // Add dark mode styles
  const style = document.createElement("style");
  style.textContent = `
    .dark-mode {
      background-color: #121212;
      color: #ffffff;
    }
    .dark-mode .activity-card {
      background-color: #1e1e1e;
      border: 1px solid #ffffff;
    }
    .dark-mode button {
      background-color: #333333;
      color: #ffffff;
    }
  `;
  document.head.appendChild(style);

  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsList = details.participants
          .map((participant) => `<li>${participant} <button class='delete-btn' data-email='${participant}'>❌</button></li>`)
          .join('');

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <strong>Participants:</strong>
            <ul>${participantsList || "<li>No participants yet</li>"}</ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
          const email = event.target.getAttribute('data-email');
          const activityName = event.target.closest('.activity-card').querySelector('h4').textContent;

          try {
            const response = await fetch(`/activities/${activityName}/remove`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
            });

            if (response.ok) {
              alert(`${email} has been removed from ${activityName}`);
              location.reload();
            } else {
              const error = await response.json();
              alert(`Error: ${error.detail}`);
            }
          } catch (error) {
            console.error('Error removing participant:', error);
            alert('An unexpected error occurred.');
          }
        });
      });

    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Update fetchActivities to refresh the activity list without reloading the page
  async function refreshActivities() {
    await fetchActivities();
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await refreshActivities(); // Refresh activities without reloading the page
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
