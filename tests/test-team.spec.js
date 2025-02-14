const { test, expect } = require('@playwright/test');

test('Join Team, Approve Request, Create Team, and Verify Membership', async ({ page }) => {
  // **1. Login as Leo**
  await page.goto('http://localhost:3001/login.html');
  await page.getByPlaceholder('Username or Email').fill('leo@example.com');
  await page.locator('#password').fill('leopass123');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  // Wait for navigation to team page
  await page.waitForURL('http://localhost:3001/team/index.html');

  // **2. Open Join Team Modal**
  await page.locator('#joinTeamBtn').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('#joinTeamBtn').click();

  // Wait for the join team modal to appear
  await page.waitForSelector('#joinTeamModal.show', { state: 'visible', timeout: 10000 });

  // **3. Enter Team Code and Join**
  await page.locator('#joinTeamModal #teamCodeInput').fill('TEAMSLAY9693');
  await page.locator('#joinTeamModal button[type="submit"]').click();

  // **4. Log out**
  const profileIcon = page.locator('img[alt="Profile"]');
  await profileIcon.click();
  await page.getByText('Log Out').click();

  // **5. Login as Alice**
  await page.goto('http://localhost:3001/login.html');
  await page.getByPlaceholder('Username or Email').fill('alice@example.com');
  await page.locator('#password').fill('alicepass123');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  // Wait for navigation
  await page.waitForURL('http://localhost:3001/myProjects/index.html');

  // **6. Accept Team Invitation**
  await page.getByRole('link', { name: 'Team' }).click();
  await page.getByRole('button', { name: 'Accept' }).waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('button', { name: 'Accept' }).click();

  // **7. Log out**
  await profileIcon.click();
  await page.getByText('Log Out').click();

  // **8. Login as Leo Again**
  await page.goto('http://localhost:3001/login.html');
  await page.getByPlaceholder('Username or Email').fill('leo@example.com');
  await page.locator('#password').fill('leopass123');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  // Wait for navigation
  await page.waitForURL('http://localhost:3001/myProjects/index.html');

  // **9. Verify Team Membership**
  await page.getByRole('link', { name: 'Team' }).click();
  await page.waitForSelector('h3 span#teamName', { state: 'visible', timeout: 10000 });

  const teamNameText = await page.locator('h3 span#teamName').textContent();
  expect(teamNameText).toContain('Team1');

  await profileIcon.click();
  await page.getByText('Log Out').click();

  // **10. Register a New User**
  await page.goto('http://localhost:3001/login.html');
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click();

  // Fill out the registration form
  await page.getByPlaceholder('Full Name').fill('Test');
  await page.getByPlaceholder('Email', { exact: true }).fill('test@example.com');
  await page.locator('#registerPassword').fill('testpass123');
  await page.getByPlaceholder('Confirm Password').fill('testpass123');
  await page.getByRole('button', { name: 'SIGN UP', exact: true }).click();

  // Wait for registration success
  const registerNotification = page.locator('.notyf__message');
  await registerNotification.waitFor({ state: 'visible', timeout: 10000 });
  await expect(registerNotification).toContainText('Registration successful');

  // **11. Login as New User**
  await page.goto('http://localhost:3001/login.html');
  await page.getByPlaceholder('Username or Email').fill('test@example.com');
  await page.locator('#password').fill('testpass123');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  // Wait for navigation to team page
  await page.waitForURL('http://localhost:3001/team/index.html');

  // **12. Open Create Team Modal**
  await page.locator('#createTeamBtn').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('#createTeamBtn').click();

  // Wait for the create team modal to appear
  await page.waitForSelector('#createTeamModal.show', { state: 'visible', timeout: 10000 });

  // **13. Enter Team Name and Create Team**
  await page.getByPlaceholder('Enter team name').fill('Test');
  await page.locator('#createTeamModal button[type="submit"]').click();

  // **14. Verify Team Creation**
  await page.waitForURL('http://localhost:3001/team/index.html');

  const teamCreateName = await page.locator('h3 span#teamName').textContent();
  expect(teamCreateName).toContain('Test');
});
