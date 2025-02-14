const prisma = require("../src/models/prismaClient");
const argon2 = require("argon2");

const persons = [
  { email: "alice@example.com", name: "Alice Smith", password: "alicepass123" },
  { email: "bob@example.com", name: "Bob Johnson", password: "bobpass123" },
  {
    email: "carol@example.com",
    name: "Carol Williams",
    password: "carolpass123",
  },
  { email: "dave@example.com", name: "Dave Brown", password: "davepass123" },
  { email: "eve@example.com", name: "Eve Davis", password: "evepass123" },
  {
    email: "frank@example.com",
    name: "Frank Wilson",
    password: "frankpass123",
  },
  {
    email: "grace@example.com",
    name: "Grace Taylor",
    password: "gracepass123",
  },
  {
    email: "heidi@example.com",
    name: "Heidi Anderson",
    password: "heidipass123",
  },
  { email: "ivan@example.com", name: "Ivan Martinez", password: "ivanpass123" },
  { email: "judy@example.com", name: "Judy Thompson", password: "judypass123" },
  { email: "leo@example.com", name: "Leo Garcia", password: "leopass123" },
];

// Function to hash passwords for all persons
async function hashPasswords(persons) {
  return Promise.all(
    persons.map(async (person) => ({
      ...person,
      password: await argon2.hash(person.password, 10),
    }))
  );
}

// Function to create teams
async function createTeams() {
  const teams = [
    { name: "Team1", teamCode: "TEAMSLAY9693" },
    { name: "Team2", teamCode: "TEAMKOKO8834" },
    { name: "Team3", teamCode: "TEAMBABY9983" },
  ];

  await prisma.team.createMany({
    data: teams,
    skipDuplicates: true,
  });

  return await prisma.team.findMany();
}

async function main() {
  const personsWithHashedPasswords = await hashPasswords(persons);
  const createdTeams = await createTeams();

  // Assign teamId to persons
  personsWithHashedPasswords.forEach((person, index) => {
    if (index < personsWithHashedPasswords.length - 1) {
      person.teamId = createdTeams[index % createdTeams.length].id;
    }
  });

  // Insert persons
  const insertedPersons = [];
  for (let person of personsWithHashedPasswords) {
    const insertedPerson = await prisma.person.create({ data: person });
    insertedPersons.push(insertedPerson);
  }

  // Create projects
  const projects = [
    {
      name: "Web Application Development 2025",
      description: "Main development project for the company website redesign",
      projectManagerId: insertedPersons[0].id,
      deadline: new Date(2025, 2, 1),
      createdAt: new Date(2025, 0, 1),
      teamId: createdTeams[0].id,
    },
    {
      name: "Mobile App Enhancement Project",
      description: "Improving the mobile application user experience",
      projectManagerId: insertedPersons[1].id,
      deadline: new Date(2025, 3, 1),
      createdAt: new Date(2025, 0, 15),
      teamId: createdTeams[1].id,
    },
    {
      name: "Cloud Infrastructure Migration",
      description: "Migrating services to cloud infrastructure",
      projectManagerId: insertedPersons[2].id,
      deadline: new Date(2025, 4, 1),
      createdAt: new Date(2025, 1, 1),
      teamId: createdTeams[2].id,
    },
  ];

  // Insert projects
  const insertedProjects = [];
  for (const project of projects) {
    const insertedProject = await prisma.project.create({ data: project });
    insertedProjects.push(insertedProject);

    // Assign project manager
    await addPersonToProject(project.projectManagerId, insertedProject.id);

    // Assign team members based on the same team
    const projectTeamId = project.teamId;
    const teamMembers = insertedPersons.filter(
      (p) => p.teamId === projectTeamId
    );

    for (const member of teamMembers) {
      if (member.id !== project.projectManagerId) {
        await addPersonToProject(member.id, insertedProject.id);
      }
    }
  }

  console.log("Seed data inserted successfully");
}

// Function to add a person to a project, ensuring the team matches
async function addPersonToProject(personId, projectId) {
  // Get the project's teamId
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { teamId: true },
  });

  if (!project) {
    throw new Error(`Project with ID ${projectId} not found`);
  }

  // Get the person's teamId
  const person = await prisma.person.findUnique({
    where: { id: personId },
    select: { teamId: true },
  });

  if (!person) {
    throw new Error(`Person with ID ${personId} not found`);
  }

  // Ensure the person belongs to the same team as the project
  if (person.teamId !== project.teamId) {
    console.warn(
      `Person ${personId} not added: Not in the same team as project ${projectId}`
    );
    return;
  }

  // Add the person to the project
  await prisma.projectPerson.create({
    data: {
      projectId,
      personId,
    },
  });

  console.log(`Person ${personId} successfully added to project ${projectId}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
