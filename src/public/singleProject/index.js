import { customFetch } from "../components/customFetch.js";

const notyf = new Notyf();
const personId = localStorage.getItem("personId");
const queryString = window.location.search;
const params = new URLSearchParams(queryString);
const projId = params.get('projId');
const projName = decodeURIComponent(params.get('projName')); 
let isManager = false;
let isDeveloper = false;

// Function to populate the tasks table

function decideRole(projId, personId) {
  return fetch(`/persons/getDevIdAndManId/${projId}/${personId}`)
    .then((response) => response.json())
    .then((returnedIds) => {
      console.log(returnedIds, "at line 18")
      if (returnedIds.length>0) {
        isDeveloper = true;
        if (returnedIds[0].personId == returnedIds[0].Project.projectManagerId) {
            isManager = true;
        }
      }    
    });
}

function addTaskRowPresent () {
  const table = document.querySelector(".task-table");
  const rows = table.querySelectorAll("tbody tr");

  if (rows.length === 0) {
    return false;
  }

  const lastRow = rows[rows.length - 1];
  const firstCol = lastRow.cells[0]; 

  if (!firstCol) {
    return false;
  }

  const srNo = firstCol.value;

  if (srNo) {
    console.log("yes")
    return true;
  } else {
    return false;
  }
}


async function fetchTasks() {
  return fetch(`/tasks/project/${projId}`)
    .then((response) => response.json())
    .catch((error) => {
      console.error("Error fetching tasks:", error);
      return [];  // Return an empty array if there's an error
    });
}

function populateTasksTable(tasks) {
      const taskTableHeader = document.getElementById("task-table-header");
      taskTableHeader.innerHTML="";
      if (isManager){
        const myProjectsTab = document.getElementById("myProjects");
        myProjectsTab.classList.add ("selectedTab"); 
        taskTableHeader.innerHTML = `
                                  <tr>
                                    <th>Sr.</th>
                                    <th>Name</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Assignees</th>
                                    <th>Actions</th>
                                  </tr>
                                `;
      } else if (isDeveloper) {
        const assignedProjectsTab = document.getElementById("assignedProjects");
        assignedProjectsTab.classList.add ("selectedTab"); 
        taskTableHeader.innerHTML = `
                                  <tr>
                                    <th>Sr.</th>
                                    <th>Name</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Assignees</th>
                                  </tr>
                                `;
      }
    
      const tasksTableBody = document.getElementById("tasksTableBody");
      const rowTemplate = document.getElementById("taskRowTemplate").content;
      const assigneeLiTemplate = document.getElementById("assigneeLiTemplate").content;
      tasksTableBody.innerHTML = ""; 


      if(tasks.length> 0) {
        tasks.forEach((task, index) => { 
        let isAssigned = isPersonAssignedToTask(task,personId);
  
        const row = document.importNode(rowTemplate, true);
        row.querySelector(".sr-no").textContent = index+1;
        if (isManager) {
          const taskNameInput = document.createElement("input");
          taskNameInput.type = "text";
          taskNameInput.value = task.name;
          taskNameInput.className = "task-name-input";
          row.querySelector(".task-name").innerHTML = ""; 
          row.querySelector(".task-name").appendChild(taskNameInput);
        
          const taskPrioritySelect = document.createElement("select");
          taskPrioritySelect.className = "task-priority-select";
          const priorities = ["LOW", "MEDIUM", "HIGH"]; 
          priorities.forEach((priority) => {
            const option = document.createElement("option");
            option.value = priority;
            option.textContent = priority;
            if (priority === task.priority) {
              option.selected = true;
            }
            taskPrioritySelect.appendChild(option);
          });
          row.querySelector(".task-priority").innerHTML = ""; // Clear previous content
          row.querySelector(".task-priority").appendChild(taskPrioritySelect);
        
          row.querySelector(".task-status").textContent = task.status;
          const adminActions = row.querySelector(".admin-actions");
         
          const editableFields = row.querySelectorAll("input, select");
          const originalValues = Array.from(editableFields).map((field) => field.value);
        
          editableFields.forEach((field, index) => {
            field.addEventListener("input", () => {
              const isChanged = Array.from(editableFields).some((f, i) => f.value !== originalValues[i]);
              if (isChanged) {
                const updateBtn = document.createElement("button");
                updateBtn.classList.add("update-btn");
                updateBtn.textContent = "Update changes";
                updateBtn.style.backgroundColor = "#0d8559"; 
                updateBtn.disabled = false;
        
                // Find the corresponding cell to append the button
                const updatedCell = field.closest("td");
        
                if (updatedCell && !updatedCell.querySelector(".update-btn")) {
                  updatedCell.appendChild(updateBtn); 
                }
        
                updateBtn.addEventListener("click", () => {
                  let data;
                  let editedField;
                  if (field === taskNameInput) {
                    const updatedName = taskNameInput.value;
                    data = {name : updatedName}
                    editedField = "name";
                  } else if (field === taskPrioritySelect) {
                          const updatedPriority = taskPrioritySelect.value; 
                          data = {priority : updatedPriority}
                          editedField = "priority";
                        }

                    fetch(`/tasks/${task.id}/${projId}/${personId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data)
                    })
                    .then(response => response.json())
                    .then(data => {
                      fetchTasks().then((tasks) => {
                        populateTasksTable(tasks);
                        activateFilter(tasks);
                      });
                      notyf.success(`Task ${editedField} has been updated!`);
                    })
                    .catch(error => {
                      alert("Error updating task name");
                    });
                  })
        
              } else {
                const updateBtnExist = field.closest("td").querySelector(".update-btn");
                if (updateBtnExist) {
                  updateBtnExist.remove();
                }
              }
            });
          });
        }
        
        else if (isDeveloper) {
    
          row.querySelector(".task-name").textContent = task.name;
          row.querySelector(".task-priority").textContent = task.priority; // Added priority display
        
          // Dropdown for task status
          const taskStatusSelect = document.createElement("select");
          if (isAssigned) {
          
            taskStatusSelect.className = "task-status-select";
            const statuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "ON_HOLD"]; // Define available statuses
            statuses.forEach((status) => {
              const option = document.createElement("option");
              option.value = status;
              option.textContent = status;
              if (status === task.status) {
                option.selected = true;
              }
              taskStatusSelect.appendChild(option);
            });
            row.querySelector(".task-status").innerHTML = ""; // Clear previous content
            row.querySelector(".task-status").appendChild(taskStatusSelect);

          } else {
            row.querySelector(".task-status").textContent = task.status;
          }

          const editableFields = row.querySelectorAll("input, select");
          const originalValues = Array.from(editableFields).map((field) => field.value);
        
          editableFields.forEach((field, index) => {
            field.addEventListener("input", () => {
              const isChanged = Array.from(editableFields).some((f, i) => f.value !== originalValues[i]);
              if (isChanged) {
                const updateBtn = document.createElement("button");
                updateBtn.classList.add("update-btn");
                updateBtn.textContent = "Update changes";
                updateBtn.style.backgroundColor = "#0d8559"; 
                updateBtn.disabled = false;
        
                // Find the corresponding cell to append the button
                const updatedCell = field.closest("td");
        
                if (updatedCell && !updatedCell.querySelector(".update-btn")) {
                  updatedCell.appendChild(updateBtn); 
                }
        
                updateBtn.addEventListener("click", () => {
                  let data;
                  let editedField;
                  if (field === taskStatusSelect) {
                    const updatedStatus = taskStatusSelect.value;
                    data = {status: updatedStatus}
                    editedField = "status";
                  }
  
                    fetch(`/tasks/${task.id}/${projId}/${personId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data)
                    })
                    .then(response => response.json())
                    .then(data => {
                      fetchTasks().then((tasks) => {
                        populateTasksTable(tasks);
                        activateFilter(tasks);
                      });
                      notyf.success(`Task ${editedField} has been updated!`);
                    })
                    .catch(error => {
                      alert("Error updating task name");
                    });
                  })
              } else {
                // If no changes, remove the button from the respective cell
                const updateBtnExist = field.closest("td").querySelector(".update-btn");
                if (updateBtnExist) {
                  updateBtnExist.remove();
                }
              }
            });
          });
        }
    
        const adminActions = row.querySelector(".admin-actions");
        if (isManager) {
          adminActions.classList.remove("admin-actions"); 
          row.querySelector(".delete-button").onclick = function () {
            deleteTask(task.id);
          };
          row.querySelector(".assign-more-btn").onclick = function () {
            // openAssignMoreModal(task.id);
            populateAssignMore(projId, task.id);
          };
  
        } else {
          adminActions.remove(); // Remove it entirely for non-admins
        }
        const assigneeUl = row.querySelector(".task-assignees");
        if (task.persons.length >0) {
        task.persons.forEach((assignment) => {
          const assigneeLi = createAssigneeLi(
            task.id,
            assigneeLiTemplate,
            task,
            assignment
          );
          assigneeUl.appendChild(assigneeLi);
        });
      } else {
        const noAssigneep = document.createElement("p"); // Create a table row element
        noAssigneep.classList.add("noAssignee")
        noAssigneep.innerHTML = "<i>No developers assigned</i>"; 
        assigneeUl.appendChild(noAssigneep);
      }

        tasksTableBody.appendChild(row);
      }); } else {
        const noTasksRow = document.createElement("tr");
        const noTasksCell = document.createElement("td");
        const numColumns = document.querySelectorAll("#task-table-header th").length;
        noTasksCell.colSpan = numColumns;
        noTasksCell.textContent = "No tasks found";
        noTasksRow.appendChild(noTasksCell);
        tasksTableBody.appendChild(noTasksRow);
      }

      if (isManager) {


        const addNewAnnoucementContainer = document.getElementById("add-new-announcement-container");
        addNewAnnoucementContainer.innerHTML = "<button class= 'right-bottom' id='addNewAnnouncementBtn'>Post Announcement</button>";

        const addNewTaskContainer = document.getElementById("add-new-task-container");
        addNewTaskContainer.innerHTML = "<button id='addNewTaskBtn'>Add new task</button>";

        const addNewDevContainer = document.getElementById("add-new-dev-container");
        addNewDevContainer.innerHTML = "<br><button id='addNewDevBtn'>Add new developers</button>"



        if (addTaskRowPresent()) {
          addNewTaskContainer.style.display="none"; 
        } else {
          addNewTaskContainer.style.display=""; 
        }
      
        const addNewTaskBtn = document.getElementById("addNewTaskBtn");
      
        // Remove any existing event listeners by replacing the button
        addNewTaskBtn.replaceWith(addNewTaskBtn.cloneNode(true));
        
        // Add the new event listener
        document.getElementById("addNewTaskBtn").addEventListener("click", () => {
          addNewTask();
          addNewTaskContainer.style.display="none"; 
        });
        document.getElementById("addNewDevBtn").addEventListener("click", () => {

        //  openAddNewDeveloperModal(projId);
        populateNewDeveloperForSingleProject(projId);
        });
        document.getElementById("addNewAnnouncementBtn").addEventListener("click", () => {

          openAnnouncementModal();        
        });

      }
    }
async function populateAssignMore(projectId, taskId) {
  const moreDeveloperCheckboxList = document.getElementById(
    "moreDeveloperCheckboxList"
  );

  try {
    const moreDevelopers = await customFetch(`/projects/getUnassignedDevelopersInProject/${projectId}/${taskId}`)
    moreDeveloperCheckboxList.innerHTML = ""; // Clear existing list
    if(moreDevelopers.length === 0 || moreDevelopers == null) {
      notyf.success("All developers in the project are already assigned to the task.")
      return;
    }
    openAssignMoreModal(taskId);

    moreDevelopers.forEach((developer) => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = developer.id;
      checkbox.id = `more-dev-${developer.id}`;
      checkbox.classList.add("more-developer-checkbox");

      const label = document.createElement("label");
      label.htmlFor = `more-dev-${developer.id}`;
      label.textContent = developer.name;
      label.style.marginLeft = "5px";

      const div = document.createElement("div");
      div.classList.add("form-check");
      div.appendChild(checkbox);
      div.appendChild(label);

      moreDeveloperCheckboxList.appendChild(div);
    });
  } catch (error) {
    console.error("Error fetching developers:", error);
  }
}

function openAssignMoreModal(taskId) {
  const modal = new bootstrap.Modal(
    document.getElementById("assignMoreDeveloperModal")
  );
  document.getElementById("assignMoreDeveloperTaskId").value = taskId;
  modal.show();
}
function openAnnouncementModal() {
  const modal = new bootstrap.Modal(
    document.getElementById("addAnnouncementModal")
  );
  // document.getElementById("").value = taskId;
  modal.show();
}

function addNewTask() {

  const tasksTableBody = document.getElementById("tasksTableBody");
  const rowTemplate = document.getElementById("taskRowTemplate").content;

  const row = document.importNode(rowTemplate, true);
  

  addTaskNameInput(row); 
  addPriorityRadioButtons(row);
  addStatusRadioButtons(row);
  populateAssigneesOptions(row, projId); 

const assignMoreButton =  row.querySelector(".assign-more-btn");
const adminActions = row.querySelector(".admin-actions");
  if (isManager) {
    adminActions.classList.remove("admin-actions"); 
    assignMoreButton.innerHTML = "Add Task";
  
    const deleteBtn = row.querySelector(".delete-button");
    if (deleteBtn) {
      deleteBtn.remove();
    }

    assignMoreButton.onclick = function () {
      addTask(row); 
    };
  } else {
    row.remove(); }

  tasksTableBody.appendChild(row);
}


function addTask(row) {  

  const taskName = document.querySelector(".newName").value; 
  const taskStatus = document.querySelector(".task-status input:checked").value; // Get selected status
  const taskPriority = document.querySelector(".task-priority input:checked").value; // Get selected priority
  const selectedAssigneesOptions = document.querySelectorAll(".task-assignees input:checked");
  const selectedAssigneeIds = Array.from(selectedAssigneesOptions).map(option => +option.value);
  const  notiMsg = `You have been assigned a new task!\nTask Name: ${taskName}`;

  if (!taskName || !taskStatus || !taskPriority || selectedAssigneeIds.length == 0) {
    notyf.error("Please fill in all required fields.");
    return;
  }
  
  fetch(`/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: taskName,
      priority: taskPriority, // Send priority
      projectId: parseInt(projId), // Send projectId (using projId here)
      status: taskStatus,
      assignedPersonId: selectedAssigneeIds,
      notiMsg,
        }),
  })
    .then((response) => {response.json()
      notyf.success(`New task (${taskName}) has been added to project ${projName}`);
    })
    .then(() => {
      fetchTasks().then((tasks) => {
        populateTasksTable(tasks);
        activateFilter(tasks);
      }); // Refresh the table
    })
    .catch((error) => console.error("Error adding task:", error));
}


// Function to add task name input field
function addTaskNameInput(row) {
  const taskNameInput = document.createElement("input");
  taskNameInput.classList.add("newName");
  taskNameInput.type = "text";
  taskNameInput.placeholder = "Enter task name";
  
  const taskNameContainer = row.querySelector(".task-name");
  taskNameContainer.textContent = ""; 
  taskNameContainer.appendChild(taskNameInput);
}

// Function to create radio buttons for priority
function addPriorityRadioButtons(row) {
  const priorities = [
    { priority: "LOW" },
    { priority: "MEDIUM" },
    { priority: "HIGH" },
  ];
  
  const taskPriorityContainer = row.querySelector(".task-priority");
  taskPriorityContainer.innerHTML = ""; // Clear any existing content

  priorities.forEach((priority) => {
    const radioButton = document.createElement("input");
    radioButton.type = "radio";
    radioButton.name = "taskPriority";
    radioButton.value = priority.priority;

    const radioLabel = document.createElement("label");
    radioLabel.textContent = priority.priority;

    // Append radio button first, then label
    taskPriorityContainer.appendChild(radioButton);
    taskPriorityContainer.appendChild(radioLabel);
    taskPriorityContainer.appendChild(document.createElement("br"));
  });

  // Set default radio button to LOW
  taskPriorityContainer.querySelector('input[value="LOW"]').checked = true;
}

function addStatusRadioButtons(row) {
  const statuses = [
    { status: "PENDING" },
    { status: "IN_PROGRESS" },
    { status: "COMPLETED" },
    { status: "ON_HOLD" },
  ];
  
  const taskStatusContainer = row.querySelector(".task-status");
  taskStatusContainer.innerHTML = ""; // Clear any existing content

  statuses.forEach((status) => {
    const radioButton = document.createElement("input");
    radioButton.type = "radio";
    radioButton.name = "taskStatus";
    radioButton.value = status.status;

    const radioLabel = document.createElement("label");
    radioLabel.textContent = status.status;

    // Append radio button first, then label
    taskStatusContainer.appendChild(radioButton);
    taskStatusContainer.appendChild(radioLabel);
    taskStatusContainer.appendChild(document.createElement("br"));
  });

  // Set default radio button to PENDING
  taskStatusContainer.querySelector('input[value="PENDING"]').checked = true;
}


function populateAssigneesOptions(row, projId) {
 
  const assigneesContainer = row.querySelector(".task-assignees"); 

  if (!assigneesContainer) {
    console.error("task-assignees container not found in row:", row);
    return; 
  }
  // customFetch(`/projects/developersInSingleProject/${projId}/`)
  customFetch(`/projects/getDeveloperWorkLoad/${projId}`)
    .then((response) => {
      if (!response) {
        throw new Error(`Failed to fetch assignees ${response.error}`);
      }
      return response;
    })
    .then((persons) => {
      assigneesContainer.innerHTML = "";
      if (persons.length>0) {
        const totalTasks = persons.reduce((sum, dev) => sum + dev.taskCount, 0);
        persons.forEach((person) => {
          const percentage = getPercentage(totalTasks, person.taskCount);
          let statusTxt;
          // Determine the color based on workload percentage
          let color;
          if (person.taskCount === 0) {
            color = "green"; // Very free
            statusTxt = "Very free";
          } else if (person.taskCount / totalTasks <= 0.2) {
            color = "green"; // Light workload
            statusTxt = "Light workload";
          } else if (person.taskCount / totalTasks <= 0.5) {
            color = "yellow"; // Moderate
            statusTxt = "Moderate workload";
          } else if (person.taskCount / totalTasks <= 0.7) {
            color = "orange"; // Busy
            statusTxt = "Busy";
          } else {
            color = "red"; // Very busy
            statusTxt = "Very busy";
          }
        
          // Create the label
          const label = document.createElement("label");
          label.textContent = ` ${person.name} `; // Space added for separation
        
          // Create the checkbox
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.name = "assignees";
          checkbox.value = person.personId;
        
          // Create the colored circle
          const circle = document.createElement("span");
          circle.style.width = "10px";
          circle.style.height = "10px";
          circle.style.borderRadius = "50%";
          circle.style.backgroundColor = color;
          circle.style.display = "inline-block";
          circle.style.marginLeft = "8px"; // Space between text and circle
          circle.style.position = "relative";
          circle.style.cursor = "pointer";
        
          // Create the tooltip
          const tooltip = document.createElement("span");
          tooltip.textContent = `${percentage} (${statusTxt})`;
          tooltip.style.position = "absolute";
          tooltip.style.backgroundColor = "black";
          tooltip.style.color = "white";
          tooltip.style.padding = "5px";
          tooltip.style.borderRadius = "5px";
          tooltip.style.fontSize = "12px";
          tooltip.style.visibility = "hidden";
          tooltip.style.whiteSpace = "nowrap";
          tooltip.style.top = "-25px";
          tooltip.style.left = "50%";
          tooltip.style.transform = "translateX(-50%)";
          tooltip.style.zIndex = "10";
        
          // Show tooltip on hover
          circle.addEventListener("mouseenter", () => {
            tooltip.style.visibility = "visible";
          });
          circle.addEventListener("mouseleave", () => {
            tooltip.style.visibility = "hidden";
          });
        
          // Append tooltip to circle
          circle.appendChild(tooltip);
        
          // Append elements in order
          label.prepend(checkbox); // Checkbox first
          label.appendChild(circle); // Circle after the name
        
          assigneesContainer.appendChild(label);
          assigneesContainer.appendChild(document.createElement("br"));
        });
        
      } else {
        assigneesContainer.innerHTML='<button id="addNewDeveloperButton">Add developers</button>';
        const addNewDeveloperButton = document.getElementById(
          "addNewDeveloperButton"
        );
    
        addNewDeveloperButton.addEventListener("click", (e) => {
          e.preventDefault();

          populateNewDeveloperForSingleProject(projId);
        })

      }
    
    })
    .catch((error) => console.error("Error fetching assignees:", error));
}


function openAddNewDeveloperModal(projectId) {
  const modal = new bootstrap.Modal(
    document.getElementById("addNewDeveloperModal")
  );
  document.getElementById("addNewDeveloperProjectId").value = projectId;
  modal.show();
}

async function populateNewDeveloperForSingleProject(projectId) {
  const newDeveloperCheckboxList = document.getElementById(
    "newDeveloperCheckboxList"
  );

  try {
    const newDevelopers = await customFetch(
      `/projects/newDevelopers/${projectId}`
    );
    newDeveloperCheckboxList.innerHTML = ""; // Clear existing list
    if(newDevelopers.length === 0) {
      notyf.success("All developers are already in the project.")
      return
    }
    openAddNewDeveloperModal(projectId)
    newDevelopers.forEach((developer) => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = developer.id;
      checkbox.id = `new-dev-${developer.id}`;
      checkbox.classList.add("new-developer-checkbox");

      const label = document.createElement("label");
      label.htmlFor = `new-dev-${developer.id}`;
      label.textContent = developer.name;
      label.style.marginLeft = "5px";

      const div = document.createElement("div");
      div.classList.add("form-check");
      div.appendChild(checkbox);
      div.appendChild(label);

      newDeveloperCheckboxList.appendChild(div);
    });
  } catch (error) {
    console.error("Error fetching developers:", error);
  }
}

async function handleAddNewDeveloperSubmit(event) {
  event.preventDefault();

  const projectId = document.getElementById("addNewDeveloperProjectId").value;
  const notiMsg = `You have been added to a new project!\nProject Name: ${projName}`;
  const selectedDeveloperIds = Array.from(
    document.querySelectorAll(".new-developer-checkbox:checked") // Updated to fetch checked checkboxes
  ).map((checkbox) => checkbox.value);

  if (selectedDeveloperIds.length === 0) {
    notyf.error("Please select at least one developer to add.");
    return;
  }

  try {
    await customFetch(`/projects/newDevelopers/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ developerIds: selectedDeveloperIds , notiMsg: notiMsg}),
    });
    notyf.success({
      message: "Developers added successfully!",
      duration: 5000,
    });
    bootstrap.Modal.getInstance(
      document.getElementById("addNewDeveloperModal")
    ).hide();  
  } catch (error) {
    console.error("Error adding developers:", error);
    notyf.error({
      message: "Failed to add developers. Please try again.",
      duration: 7000,
    });
  }
}
async function handleAssignMoreSubmit(event) {
  event.preventDefault();

  const taskId = document.getElementById("assignMoreDeveloperTaskId").value;
  const selectedDeveloperIds = Array.from(
    document.querySelectorAll(".more-developer-checkbox:checked") // Updated to fetch checked checkboxes
  ).map((checkbox) => checkbox.value);

  if (selectedDeveloperIds.length === 0) {
    notyf.error("Please select at least one developer to assign.");
    return;
  }

  try {
    await customFetch(`/tasks/assignMore/${taskId}/${projId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ developerIds: selectedDeveloperIds }),
    });
    notyf.dismiss();
    notyf.success({
      message: "More developers assigned successfully!",
      duration: 5000,
    });
    bootstrap.Modal.getInstance(
      document.getElementById("assignMoreDeveloperModal")
    ).hide();  

  } catch (error) {
    console.error("Error assigning more developers:", error);
    notyf.error({
      message: "Failed to assign more developers. Please try again.",
      duration: 7000,
    });
  }
  ///refresh
  fetchTasks().then((tasks) => {
    populateTasksTable(tasks);
    activateFilter(tasks);
  });
}

//######################################################################################################
//######################################################################################################
function openTransferDeveloperModal(taskId, projectId, transferringId) {

  const modal = new bootstrap.Modal(
    document.getElementById("transferDeveloperModel")
  );
  modal.show();
  // populateTransferDeveloperRadioList(taskId,projectId,transferringId);

}

async function populateTransferDeveloperRadioList(taskId, projectId, transferringId) {
  const transferDeveloperRadioList = document.getElementById("transferDeveloperRadioList");

  try {
    customFetch(`/projects/getUnassignedDevelopersInProject/${projectId}/${taskId}`)
      .then((developers) => {
        if(developers.length === 0) {
          notyf.success("All developers are already assigned with this task.")
          return false;
        }
        openTransferDeveloperModal(taskId, projectId, transferringId);

        const otherDevelopers = developers.filter(
          (developer) => developer.id !== parseInt(transferringId, 10)
        );
        // Clear the existing content in the list
        transferDeveloperRadioList.innerHTML = ""; 
  
        // Iterate through the developers array to create radio buttons
        otherDevelopers.forEach((developer, index) => {
          const radio = document.createElement("input");
          radio.type = "radio";
          radio.name = "developerTransfer"; 
          radio.value = developer.id;
          radio.id = `transfer-dev-${developer.id}`;
          radio.classList.add("form-check-input");

          if (index === 0) {
            radio.checked = true; // Auto-select the first radio button
          }
  
          const label = document.createElement("label");
          label.htmlFor = `transfer-dev-${developer.id}`;
          label.textContent = developer.name;
          label.classList.add("form-check-label");
  
          const div = document.createElement("div");
          div.classList.add("form-check"); // Bootstrap form-check styling
          div.appendChild(radio);
          div.appendChild(label);
  
          transferDeveloperRadioList.appendChild(div);
        });

      })
      .catch((error) => {
        console.error("Error fetching developers:", error);
      });
           
      const submitTransferDeveloperButton = document.getElementById("submitTransferDeveloperButton");
      submitTransferDeveloperButton.addEventListener("click", (event) => {
        handleTransferDeveloperSubmit(event, taskId, transferringId);
      }, {once: true});

  } catch (error) {
    console.error("Unexpected error:", error);
  }

}

async function handleTransferDeveloperSubmit(event, taskId, transferringId) {

  event.preventDefault(); 
  const selectedDeveloperId = document.querySelector(
    "input[name='developerTransfer']:checked"
  )?.value; 



  try {
    await customFetch(`/tasks/assignment/${taskId}/${transferringId}/transfer/${selectedDeveloperId}/${projId}`, {
      method: "PUT",
    });
    
    notyf.dismiss();
    notyf.success("Developer transferred successfully!");
    bootstrap.Modal.getInstance(
      document.getElementById("transferDeveloperModel")
    ).hide();


  } catch (error) {
    console.error("Error transferring developer:", error);
    notyf.dismiss();
    notyf.error("Failed to transfer developer. Please try again.");
  }

  fetchTasks().then((tasks) => {
    populateTasksTable(tasks);
    activateFilter(tasks);
  });
}
async function handleAddAnnouncementSubmit(event) {

  event.preventDefault(); 
  // const announcementTitle = document.getElementById("announcementTitle").value;
  const announcementBody = document.getElementById("announcementBody").value; 
  let data = {message: announcementBody, projectIdStr: projId}

  try {  
    await customFetch(`/projects/announcement/`, {
      method: "Post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    notyf.dismiss();
    notyf.success("Announcement posted successfully!");
    bootstrap.Modal.getInstance(
      document.getElementById("addAnnouncementModal")
    ).hide();


  } catch (error) {
    console.error("Error posting announcement:", error);
    notyf.dismiss();
    notyf.error("Failed to post anouncement. Please try again.");
  }

  // fetchTasks().then((tasks) => {
  //   populateTasksTable(tasks);
  //   activateFilter(tasks);
  // });
}



//######################################################################################################
//######################################################################################################

function createAssigneeLi( taskId, assigneeLiTemplate, task, assignment) {
  // const selectedTaskId = .querySelector(".task-id-input");

  const assigneeLi = document.importNode(assigneeLiTemplate, true);
  let name =  assignment.person.name ? assignment.person.name : "No assignees";
  assigneeLi.querySelector(".assigneeName").textContent = name;  
  const adminActions = assigneeLi.querySelector(".admin-actions");
  if (isManager) {

    adminActions.classList.remove("admin-actions"); 
    assigneeLi.querySelector(".unassignButton").onclick = function () {
    fetch(`/tasks/assignment/${task.id}/unassign/${assignment.person.id}/projectId/${projId}`, {
      method: "DELETE",
    })
    .then(() => {
      notyf.success(`Unassigned from task successfully`);
      fetchTasks().then((tasks) => {
        populateTasksTable(tasks);
        activateFilter(tasks);
      });
    });
    
    };

    assigneeLi.querySelector(".transferAssignButton").onclick = function () {
      populateTransferDeveloperRadioList(taskId,projId,assignment.person.id)

      // openTransferDeveloperModal(taskId, projId, assignment.person.id);
      };
    
  } else {
    adminActions.remove(); 
  } 

  return assigneeLi;
}

// Function to delete a task
function deleteTask(id) {
  fetch(`/tasks/${id}`, {
    method: "DELETE",
  })
    .then(() => {
      notyf.success(`Task (id:${id}) deleted successfully`);
      fetchTasks().then((tasks) => {
        populateTasksTable(tasks);
      });; // Refresh the table
    })
    .catch((error) => console.error("Error deleting task:", error));
}

function populateHeader (name) {
  const headerh1 = document.getElementById("projName");
  headerh1.innerText= `Manage ${name}`
}

function isPersonAssignedToTask(task, personId) {
  return task.persons.some(personObj => parseInt(personObj.person.id) === parseInt(personId));
}

function validateText (text) {
  const filteredValue = text.replace(/[^a-zA-Z0-9\s]/g, "");
  if (text!== filteredValue) {
    notyf.error("Invalid search input")
    return null;
  } else {
    return filteredValue;
  }
}
function activateFilter(tasks) {

  const searchBar = document.getElementById('searchBar');
  const statusFilter = document.getElementById('statusFilter');
  const priorityFilter = document.getElementById('priorityFilter');
  const filterInfo = document.querySelector(".filterInfo");
  filterInfo.style.display = "card";
  function filterTasks() {
    const searchText = searchBar.value.toLowerCase();
    const validSearchText = validateText(searchText);
    if (validSearchText==null) return;
    const selectedStatus = statusFilter.value;
    const selectedPriority = priorityFilter.value;

    const filteredTasks = tasks.filter((task) => {
      const matchesSearch = task.name.toLowerCase().includes(searchText);
      const matchesStatus = selectedStatus ? task.status === selectedStatus : true;
      const matchesPriority = selectedPriority ? task.priority === selectedPriority : true;
      return matchesSearch && matchesStatus && matchesPriority;
    });
    populateTasksTable(filteredTasks);
    updateFilterInfo(searchText, selectedStatus, selectedPriority, filteredTasks.length);
  }

  function updateFilterInfo(searchText, selectedStatus, selectedPriority, count) {
    let filterDetails ="";
    if (searchText || selectedPriority || selectedStatus ){ 
      filterDetails +=`<b>${count} Filtered results found </b><br><strong>Filtered info</strong> `;
    }

    if (searchText) {
      filterDetails += `Name: "${searchText}", `;
    }
    if (selectedPriority) {
      filterDetails += `Priority: ${selectedPriority}, `;
    }

    if (selectedStatus) {
      filterDetails += `Status: ${selectedStatus}, `;
    }

    // Remove the last comma and space if there are any filters applied
    filterDetails = filterDetails.endsWith(', ') ? filterDetails.slice(0, -2) : filterDetails;

    // Display filter information
    filterInfo.innerHTML = `<p>${filterDetails}</p>`|| 'No filters applied';
  }

  searchBar.addEventListener('input', filterTasks);
  statusFilter.addEventListener('change', filterTasks);
  priorityFilter.addEventListener('change', filterTasks);

  filterTasks();
}




document.addEventListener("DOMContentLoaded", async () => {
  setupSelectAllButtons();
    // Add event listener for form submission
    document
    .getElementById("addNewDeveloperForm")
    .addEventListener("submit", handleAddNewDeveloperSubmit);
    document
    .getElementById("assignMoreDeveloperForm")
    .addEventListener("submit", handleAssignMoreSubmit);
    document
    .getElementById("addAnnouncementForm")
    .addEventListener("submit", handleAddAnnouncementSubmit);


  try {
    await decideRole(projId, personId); // Wait for decideRole to finish
    

    if (isDeveloper || isManager) {
      populateHeader(projName);
      // fetchDeveloperWorkLoad();
      fetchTasks().then((tasks) => {
        populateTasksTable(tasks);
        activateFilter(tasks);
      });
      
    } else {
      const tableContainer = document.querySelector(".table-container");
      tableContainer.innerHTML = "";
      tableContainer.innerHTML = '<p class=\"unauth\">You are not authorized</p>'
    }
  } catch (error) {
    console.error("Error in decideRole or subsequent operations:", error);
  }
  goToTask();
}
);

function setupSelectAllButtons() {
  // Toggle Select All for New Developer List
  document
    .getElementById("selectAllNewDeveloperButton")
    .addEventListener("click", function () {
      const checkboxes = document.querySelectorAll(".new-developer-checkbox");
      const allSelected = Array.from(checkboxes).every(
        (checkbox) => checkbox.checked
      );

      checkboxes.forEach((checkbox) => {
        checkbox.checked = !allSelected; // Toggle state
      });

      this.textContent = allSelected ? "Select All" : "Deselect All";
    });

  document
    .getElementById("selectAllMoreDeveloperButton")
    .addEventListener("click", function () {
      const checkboxes = document.querySelectorAll(".more-developer-checkbox");
      const allSelected = Array.from(checkboxes).every(
        (checkbox) => checkbox.checked
      );

      checkboxes.forEach((checkbox) => {
        checkbox.checked = !allSelected; // Toggle state
      });

      this.textContent = allSelected ? "Select All" : "Deselect All";
    });
}

function goToTask() {
  const urlParams = new URLSearchParams(window.location.search);
  const name = urlParams.get("taskId");
  if (name) {
    scrollToTaskByName(name);
    scrollToTaskByName("Task 1 for Project K11");  // Match this string exactly

  }
}
function scrollToTaskByName(taskName) {
  // Find the row containing the task name with the class 'task-name'
  const rows = document.querySelectorAll("tr"); // Get all rows in the table
  let targetRow = null;

  rows.forEach(row => {
    const taskNameCell = row.querySelector("td.task-name"); // Select the td with class 'task-name' in each row
    if (taskNameCell) {
      // Ensure to trim spaces and compare the textContent correctly
      const cellText = taskNameCell.textContent.trim(); // Get and trim text content of the task name cell
      if (cellText === taskName.trim()) { // Match the task name
        targetRow = row; // Found the row with the task name
      }
    }
  });

  if (targetRow) {
    highlightRow(targetRow);
    scrollToElement(targetRow); // Scroll to the found row
  } else {
    console.error(`Task with the name "${taskName}" not found.`);
  }
}

function scrollToElement(element) {
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    console.error("Element not found for scrolling.");
  }
}
document.getElementById("viewFilesButton").addEventListener("click", () => {
  window.location.href = `../files/index.html?project=${projId}`;
});

function highlightRow(row) {
  row.classList.add("highlight"); // Add the highlight class to the row
  // Remove highlight after a certain time (for example, 2 seconds)
  setTimeout(() => {
    row.classList.remove("highlight");
  }, 2000); // Highlight duration (in milliseconds)
}

// async function fetchDeveloperWorkLoad () {
//   return customFetch(`/projects/getDeveloperWorkLoad/${projId}`)
//     .then((response) => { 
//       populateWorkLoad(response);
//     })
//     .catch((error) => {
//       console.error("Error fetching tasks:", error);
//       return [];  // Return an empty array if there's an error
//     });
// }

// function populateWorkLoad (workload) {
//   workload.forEach((dev) => {
//     console.log("Name: ", dev.name)
//     console.log("Tasks: ", dev.taskCount);
//   })
// }

function getPercentage(total, individual) {
  if (total === 0) return 0; // Avoid division by zero
  return (((individual / total) * 100).toFixed(1)+ "%"); // Return percentage with 2 decimal places
}
