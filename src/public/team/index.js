import { customFetch } from "../components/customFetch.js";
const notyf = new Notyf();
const loggedinmemberId = localStorage.getItem("personId");


document.addEventListener("DOMContentLoaded", async () => {
  const teamSection = document.getElementById("teamSection");

  // Fetch the team data for the current user
  async function fetchTeamData() {
    try {
      const data = await customFetch("/persons/id");

      if (data.teamId) {
        const teamData = await customFetch(`/teams/${data.teamId}`);
        if (!teamData || teamData.error) {
          throw new Error("Invalid team ID");
        }
        return teamData;
      }
      return null;
    } catch (error) {
      notyf.error("Error fetching team data.");
      console.error("Error fetching team:", error);
      return null;
    }
  }

  async function fetchPendingRequests() {
    try {
      const pendingRequests = await customFetch("/teams/pending");
  
      if (!Array.isArray(pendingRequests)) {
        throw new Error("Unexpected response format for pending requests.");
      }
  
      console.log("Fetched pending requests:", pendingRequests);
      return pendingRequests;
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      notyf.error(error.message || "Failed to load pending requests.");
      return [];
    }
  }  

  async function fetchTeamRequests(teamId) {
    try {
        const requests = await customFetch(`/teams/${teamId}/requests`);
        return requests;
    } catch (error) {
        console.error("Error fetching team requests:", error);
        return [];
    }
  }

  async function acceptTeamRequest(requestId) {
    try {
        await customFetch(`/teams/requests/${requestId}/accept`, { method: "POST" });
        notyf.success("Request accepted!");
        setTimeout(() => location.reload(), 1000); // Refresh page after 1 second
    } catch (error) {
        notyf.error("Failed to accept request.");
        console.error(error);
    }
  }

  async function rejectTeamRequest(requestId) {
    try {
        await customFetch(`/teams/requests/${requestId}/reject`, { method: "POST" });
        notyf.success("Request rejected!");
        setTimeout(() => location.reload(), 1000); // Refresh page after 1 second
    } catch (error) {
        notyf.error("Failed to reject request.");
        console.error(error);
    }
  }

  async function copyTeamCode() {
    const teamCodeElement = document.getElementById("teamCode");
    if (teamCodeElement) {
      const teamCode = teamCodeElement.textContent;
      navigator.clipboard.writeText(teamCode).then(() => {
        notyf.success("Team code copied to clipboard!");
      }).catch(err => {
        notyf.error("Failed to copy team code.");
        console.error("Copy error:", err);
      });
    }
  }

  // Function to update the team section
  async function updateTeamSection() {
    let teamData = null;
    let pendingRequests = [];

    try {
        teamData = await fetchTeamData();
        // console.log(teamData,"at 97")
        pendingRequests = await fetchPendingRequests();
    } catch (error) {
        console.error("Error fetching data:", error);
    }

    let teamHTML = "";

    if (teamData) {
        const teamRequests = await fetchTeamRequests(teamData.id);

        teamHTML = `
            <div class="card p-3">
                <h3>Your Team: <span id="teamName">${teamData.name}</span></h3>
                <p><strong>Team Code:</strong> <span id="teamCode">${teamData.teamCode}</span>
                    <button class="btn btn-primary btn-sm copy-btn mx-2" data-copy-code>
                        <i class="fas fa-copy"></i>
                    </button>
                </p>
            </div>
        `;

        if (teamRequests.length > 0) {
          teamHTML += `
            <div class="card p-3">
              <h4 class="text-center">Pending Team Join Requests</h4>
              <div id="requestsContainer" class="row row-cols-1 row-cols-md-3 g-4">
                ${teamRequests.map(request => `
                  <div class="col d-flex justify-content-center request-item" data-request-id="${request.requestId}">
                    <div class="card p-3 text-center" style="width: 18rem; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);">
                      <h5 class="card-title">${request.personName}</h5>
                      <p class="card-text">${request.personEmail}</p>
                      <div class="d-flex justify-content-center">
                        <button class="btn btn-primary btn-sm accept-btn mx-1">
                          <i class="fas fa-check"></i> Accept
                        </button>
                        <button class="btn btn-danger btn-sm reject-btn mx-1">
                          <i class="fas fa-times"></i> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          `;
        }
    } else if (pendingRequests.length > 0) {
        teamHTML = `
            <div class="card p-3 text-center">
                <h4>Your request to join a team is pending.</h4>
                <ul>
                    ${pendingRequests.map(request => `<li>Request to join <b>${request.teamName}</b> is pending approval.</li>`).join("")}
                </ul>
            </div>
        `;
    } else {
        teamHTML = `
            <div class="card p-3">
                <h4>You are not part of a team yet.</h4>
                <button id="createTeamBtn" class="btn btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#createTeamModal">Create Team</button>
                <button id="joinTeamBtn" class="btn btn-secondary mt-2" data-bs-toggle="modal" data-bs-target="#joinTeamModal">Join Team</button>
            </div>
        `;
    }

    // Update DOM
    teamSection.innerHTML = teamHTML;

    document.addEventListener("click", async (event) => {
      if (event.target.closest(".accept-btn")) {
        const requestId = event.target.closest(".request-item").dataset.requestId;
        await acceptTeamRequest(requestId);
      }
  
      if (event.target.closest(".reject-btn")) {
        const requestId = event.target.closest(".request-item").dataset.requestId;
        await rejectTeamRequest(requestId);
      }
  
      if (event.target.closest("[data-copy-code]")) {
        await copyTeamCode();
      }
    });

    // If no team, add event listeners for creating and joining
    if (!teamData) {
        document.getElementById("createTeamForm")?.addEventListener("submit", handleCreateTeam);
        document.getElementById("joinTeamForm")?.addEventListener("submit", handleJoinTeam);
    } else {
        await updateTeamPersons(); // Fetch team members if user is in a team
        // console.log ("at 188" , teamData.id);
        await updateTeamProjects(teamData.id); // Fetch team projects if user is in a team
    }
  }

  // Handle Creating a Team
  async function handleCreateTeam(event) {
    event.preventDefault();

    const teamName = document.getElementById("teamName").value.trim();
    if (!teamName) {
      notyf.error("Team name is required.");
      return;
    }

    try {
      const response = await customFetch("/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ teamName }),
      });

      if (response.teamCode) {
        notyf.success(`Team created successfully! Your code: ${response.teamCode}`);
      } else {
        notyf.success("Team created successfully!");
      }

      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      notyf.error(`Failed to create team: ${error.message}`);
      console.error("Error creating team:", error);
    }
  }

  // Handle Joining a Team
  async function handleJoinTeam(event) {
    event.preventDefault();

    const teamCode = document.getElementById("teamCodeInput").value.trim();
    if (!teamCode) {
      notyf.error("Please enter a team code.");
      return;
    }

    try {
      const response = await customFetch("/teams/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ teamCode }), // Send team code instead of ID
      });

      notyf.success("Successfully joined the team!");
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      notyf.error(`Failed to join team: ${error.message}`);
      console.error("Error joining team:", error);
    }
  }

  // Fetch the team members
  async function fetchTeamPersons() {
    try {
      const persons = await customFetch("/teams/persons");
      return persons;
    } catch (error) {
      console.error("Error fetching team persons:", error);
      notyf.error(error.message || "Failed to load team persons.");
      return [];
    }
  }
  async function fetchTeamPojects(teamId) {
    try {
      const projects = await customFetch(`/teams/project/${teamId}`);
      return projects;
    } catch (error) {
      console.error("Error fetching team projects:", error);
      notyf.error(error.message || "Failed to load team persons.");
      return [];
    }
  }
  // Update the team members section
  async function updateTeamPersons() {
    try {
      const persons = await fetchTeamPersons();

      if (persons.length === 0) {
        teamSection.innerHTML += `
          <div class="alert alert-info" role="alert">
            No persons found in your team. Please invite team members to join.
          </div>
        `;
        return;
      }

      const personCards = persons.map((person) => `
        <div class="col-lg-4 col-md-6 mb-3 d-flex justify-content-center">
          <div class="card p-3 text-center" style="width: 18rem; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);">
            <img src="${person.avatar || '/images/default-avatar.png'}" 
                alt="${person.name}" 
                class="card-img-top rounded-circle mx-auto" 
                style="width: 100px; height: 100px; object-fit: cover;">
            <div class="card-body">
              <h5 class="card-title">${person.name}</h5>
              <p class="card-text">
                <a href="mailto:${person.email}" class="email-link" title="Send Email">
                  <i class="fas fa-envelope"></i>
                </a>
              </p>
            </div>
          </div>
        </div>
      `).join("");


      teamSection.innerHTML += `
        <h3 class="text-center mt-4">Team Members</h3>
        <div class="row">${personCards}</div>
      `;
    } catch (error) {
      console.error("Error fetching team persons:", error);
      teamSection.innerHTML += `
        <div class="alert alert-danger" role="alert">
          Failed to load team members. Please try again later.
        </div>
      `;
    }
  }

  async function updateTeamProjects(teamId) {
    try {
        const projects = await fetchTeamPojects(teamId);
        // console.log(projects, "at 326 ");

        if (projects.length === 0) {
            teamSection.innerHTML += `
              <div class="alert alert-info" role="alert">
                No projects found in your team yet. Start by creating one!
              </div>
            `;
            return;
        }

        // ✅ Fetch user's join requests
        const myRequests = await customFetch(`/teams/getMyRequests`);
        const requestMap = new Map(myRequests.map(req => [req.project.id, req.approve]));

        const personsPromises = projects.map((project) => customFetch(`/persons/${project.project_id}`));
        const personsData = await Promise.all(personsPromises);

        // Create UI for each project
        const projectListItems = projects.map((project, index) => {
            const totalTasks = project.completed_count + project.in_progress_count + project.pending_count + project.on_hold_count;
            const completedPercentage = totalTasks === 0 ? 0 : (project.completed_count / totalTasks) * 100;
            const completedPercentageText = `${Math.round(completedPercentage)}%`;

            const isManagerOfTheProject = project.manager_id === parseInt(loggedinmemberId);
            const personsOfTheProj = personsData[index];
            const isDeveloperOfTheProject = personsOfTheProj.some(person => person.id === parseInt(loggedinmemberId));
            let alreadyIn = isManagerOfTheProject || isDeveloperOfTheProject;

            let requestStatus = requestMap.get(project.project_id);
            let requestStatusText = "";  
            let joinButtonHTML = "";   
            let rejected = false;

            if (!alreadyIn) {
                if (requestStatus === null) {
                    requestStatusText = `<span class="badge bg-warning ms-2">Pending Approval</span>`;
                } else if (requestStatus === false) {
                    rejected = true;
                    requestStatusText = `<span class="badge bg-danger ms-2">Request Rejected</span>`;
                }
            }

            if (!alreadyIn && requestStatus === undefined) {
                joinButtonHTML = `<button id="projectRequest" class="btn btn-primary" data-project-id="${project.project_id}">Ask to Join</button>`;
            }

            return `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center" role="button" data-bs-toggle="collapse" href="#collapseProject${index}" aria-expanded="false" aria-controls="collapseProject${index}">
                        <div class="d-flex w-100 justify-content-between">
                            <span class="justify-content-between">
                                <strong>${project.project_name}</strong> ${requestStatusText}
                                ${alreadyIn 
                                    ? `<span class="badge ${isManagerOfTheProject ? 'bg-success' : 'bg-success'}">
                                          ${isManagerOfTheProject ? 'My Project' : 'Assigned Project'}
                                      </span>` 
                                    : ''
                                }
                            </span>
                           <span>
                              ${completedPercentageText} completed
                              <div class="progress" style="height: 10px;" data-bs-toggle="tooltip" data-bs-placement="top" title="${completedPercentageText}">
                                  <div class="progress-bar" role="progressbar" style="width: ${completedPercentage}%;"
                                      aria-valuenow="${completedPercentage}" aria-valuemin="0" aria-valuemax="100"
                                      class="${completedPercentage >= 70 ? 'bg-success' : (completedPercentage >= 40 ? 'bg-warning' : 'bg-danger')}">
                                  </div>
                              </div>
                          </span>
                        </div>
                    </div>
                    <div class="collapse" id="collapseProject${index}">
                        <div class="card-body">
                            <ul class="list-group">
                                <li class="d-flex justify-content-left"><strong>Description:</strong> <span>${project.description || "No description"}</span></li>
                                <li class="d-flex justify-content-left"><strong>Manager:</strong> <span>${project.project_manager || "Not assigned"}</span></li>
                                <li class="d-flex justify-content-left"><strong>Created At:</strong> <span>${new Date(project.createdAt).toLocaleDateString()}</span></li>
                                <li class="d-flex justify-content-left"><strong>Deadline:</strong> <span>${project.deadline ? new Date(project.deadline).toLocaleDateString() : "No deadline"}</span></li>
                                <li class="d-flex justify-content-left"><strong>Completed tasks:</strong> <span>${project.completed_count}</span></li>
                                <li class="d-flex justify-content-left"><strong>In progress tasks:</strong> <span>${project.in_progress_count}</span></li>
                                <li class="d-flex justify-content-left"><strong>Pending tasks:</strong> <span>${project.pending_count}</span></li>
                                <li class="d-flex justify-content-left"><strong>On hold tasks:</strong> <span>${project.on_hold_count}</span></li>
                                <li class="d-flex justify-content-center mt-3">
                                  ${alreadyIn 
                                      ? `<button class="btn btn-primary" onclick="window.location.href='/singleProject/index.html?projId=${project.project_id}&projName=${encodeURIComponent(project.project_name)}'">Manage Project</button>` 
                                      : joinButtonHTML}
                                      ${rejected ? `
                                        <a href="mailto:${project.manageremail}" class="btn btn-outline-danger">
                                            <strong> Contact ${project.project_manager}</strong>
                                        </a>
                                    ` : ""}                                    
                                    
                              </li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        // Append the list to the team section
        teamSection.innerHTML += `
            <h3 class="text-center mt-4 mb-4">Team Projects</h3>
            <div class="accordion" id="projectsAccordion">
                ${projectListItems}
            </div>
        `;

        // Initialize Bootstrap tooltips
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipTriggerList.forEach((tooltipTriggerEl) => {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });

    } catch (error) {
        console.error("Error fetching team projects:", error);
        teamSection.innerHTML += `
            <div class="alert alert-danger" role="alert">
                Failed to load team projects. Please try again later.
            </div>
        `;
    }
}

  updateTeamSection();
});


document.addEventListener("click", function (event) {
  if (event.target.id === "projectRequest") {
    const projectId = event.target.getAttribute("data-project-id");

    customFetch("/teams/joinProject", {
      method: "POST",
      body: JSON.stringify({ projectId }),
    })
      .then((response) => {
        notyf.success(`${response.message}`);
        setTimeout(() => {
          window.location.reload();
        }, 2500);
      })
      .catch((error) => {
        notyf.error("Failed to send the join request. Please try again.");
      });
  }
});
