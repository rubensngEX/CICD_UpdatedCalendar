const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3001/login.html');
});

test.describe('Team Page', () => {

  test ('Should be able to manage own project in Team projects', async ({page}) => {
   await page.getByPlaceholder('Username or Email').click();
   await page.getByPlaceholder('Username or Email').fill('Alice Smith');
   await page.locator('#password').click();
   await page.locator('#password').fill('alicepass123');
   await page.getByRole('button', { name: 'LOGIN' }).click();
   await page.getByRole('link', { name: 'Team' }).click();
   await expect(page.getByRole('heading', { name: 'Team Projects' })).toBeVisible();
   await expect(page.getByRole('button', { name: 'Web Application Development' })).toBeVisible();
   await page.getByRole('button', { name: 'Web Application Development' }).click();
   await expect(page.getByRole('button', { name: 'Manage Project' })).toBeVisible();
   await page.getByRole('button', { name: 'Manage Project' }).click();
   await expect(page).toHaveURL(/.*\/singleProject\/index\.html\?.*/);

  })

  test ('Should be able to send request join other projects in the same team', async({page}) => {
    await page.getByPlaceholder('Username or Email').click();
    await page.getByPlaceholder('Username or Email').fill('Dave Brown');
    await page.locator('#password').click();
    await page.locator('#password').fill('davepass123');
    await page.getByRole('button', { name: 'LOGIN' }).click(); 

    await page.getByRole('button', { name: 'Create New Project' }).click();
    await page.getByRole('textbox', { name: 'Project Name' }).fill('Test Project by Dave in Team 1');
    await page.getByRole('textbox', { name: 'Project Description' }).click();
    await page.getByRole('textbox', { name: 'Project Description' }).fill('Test Project by Dave in Team 1');
    await page.getByRole('button', { name: 'Create Project' }).click();
    await expect(page.locator('div').filter({ hasText: 'Project created successfully!' }).nth(2)).toBeVisible();

    await page.getByRole('img', { name: 'Profile' }).click();
    await page.getByText('Log Out').click();
    await page.getByPlaceholder('Username or Email').click();
    await page.getByPlaceholder('Username or Email').fill('Alice Smith');
    await page.locator('#password').click();
    await page.locator('#password').fill('alicepass123');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await page.getByRole('link', { name: 'Team' }).click();
    await page.getByRole('button', { name: 'Test Project by Dave in Team' }).click();
    await expect(page.getByRole('button', { name: 'Ask to Join' })).toBeVisible();
    await page.getByRole('button', { name: 'Ask to Join' }).click();
    await expect(page.locator('div').filter({ hasText: 'Successfully requested to' }).nth(2)).toBeVisible();
   
  })



});