document.addEventListener("DOMContentLoaded", () => {
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
      // Reset activity select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsList = details.participants && details.participants.length > 0
          ? details.participants.map(p => `<li>${p}</li>`).join('')
          : '<li><em>No participants yet</em></li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Signed Up Students:</h5>
            <ul class="participants-list">
              ${participantsList}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Show participants with a delete button for each
        const participantsHeading = document.createElement('p');
        participantsHeading.innerHTML = `<strong>Participants (${details.participants.length}):</strong>`;
        activityCard.appendChild(participantsHeading);

        const participantsList = document.createElement('ul');
        participantsList.className = 'participants';
        details.participants.forEach((email) => {
          const li = document.createElement('li');
          li.className = 'participant-item';
          const span = document.createElement('span');
          span.textContent = email;
          const btn = document.createElement('button');
          btn.className = 'delete-btn';
          btn.textContent = '🗑️';
          btn.title = 'Unregister';
          btn.dataset.activity = name;
          btn.dataset.email = email;
          li.appendChild(span);
          li.appendChild(btn);
          participantsList.appendChild(li);
        });
        activityCard.appendChild(participantsList);

        participantsList.addEventListener('click', async (e) => {
          if (!e.target.classList.contains('delete-btn')) return;
          const activityName = e.target.dataset.activity;
          const email = e.target.dataset.email;
          if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

          try {
            const res = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, {
              method: 'DELETE'
            });
            const result = await res.json();
            if (res.ok) {
              // Refresh the activities list to reflect the removal
              await fetchActivities();
              messageDiv.textContent = result.message;
              messageDiv.className = 'success';
              messageDiv.classList.remove('hidden');
              setTimeout(() => {
                messageDiv.classList.add('hidden');
              }, 5000);
            } else {
              messageDiv.textContent = result.detail || 'Failed to unregister';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
            }
          } catch (err) {
            messageDiv.textContent = 'Failed to unregister. Please try again.';
            messageDiv.className = 'error';
            messageDiv.classList.remove('hidden');
            console.error('Error unregistering:', err);
          }
        });

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
        // Refresh activity list so the new participant shows up immediately
        await fetchActivities();
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
