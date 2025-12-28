document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper to escape text for insertion into HTML
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select to avoid duplicate options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        const participants = Array.isArray(details.participants) ? details.participants : [];
        let participantsHTML = "";
        if (participants.length > 0) {
          participantsHTML = `
            <div class="participants">
              <strong>Participants</strong>
              <ul class="participants-list">
                ${participants.map(p => `<li class="participant-item"><div class="participant-row"><span class="participant-email">${escapeHTML(p)}</span><button class="delete-btn" data-activity="${escapeHTML(name)}" data-email="${escapeHTML(p)}" title="Unregister participant">✖</button></div></li>`).join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants no-participants">
              <strong>Participants</strong>
              <div class="no-participants-text">No participants yet</div>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${escapeHTML(name)}</h4>
          <p>${escapeHTML(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHTML(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
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
        // Refresh activities to show the newly registered participant
        fetchActivities();
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

  // Delegate delete button clicks to unregister participants
  activitiesList.addEventListener("click", async (event) => {
    const btn = event.target.closest(".delete-btn");
    if (!btn) return;

    const email = btn.dataset.email;
    const activity = btn.dataset.activity;

    if (!email || !activity) return;

    try {
      const resp = await fetch(`/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`, { method: "DELETE" });
      const result = await resp.json();

      if (resp.ok) {
        // Refresh list
        fetchActivities();
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 3000);
      } else {
        messageDiv.textContent = result.detail || "Failed to unregister";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }
    } catch (err) {
      console.error("Error unregistering:", err);
      messageDiv.textContent = "Failed to unregister. Try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  });
});
