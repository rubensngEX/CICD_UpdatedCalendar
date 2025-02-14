const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3001/login.html');
  await page.getByPlaceholder('Username or Email').click();
  await page.getByPlaceholder('Username or Email').fill('Alice Smith');
  await page.locator('#password').click();
  await page.locator('#password').fill('alicepass123');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.getByRole('button', { name: 'Manage Project' }).click();
});

test.describe('Single Project Page', () => {

  test("Should be able to filter tasks by priority", async ({ page }) => {
    await expect(page.locator("#priorityFilter")).toBeVisible();
    await page.locator("#priorityFilter").click();
    await page.locator("#priorityFilter").selectOption("HIGH");
    await expect(page.getByText("Filtered results found")).toBeVisible();
    await expect(
      page.getByText("Filtered results found Filtered info Priority: HIGH")
    ).toBeVisible();
  });

  test("Should be able to filter tasks by status", async ({ page }) => {
    await expect(page.locator("#statusFilter")).toBeVisible();
    await page.locator("#statusFilter").click();
    await page.locator("#statusFilter").selectOption("COMPLETED");
    await expect(page.getByText("Filtered results found")).toBeVisible();
    await expect(
      page.getByText("Filtered results found Filtered info Status: COMPLETED")
    ).toBeVisible();
  });

  test('Should be able to add new task to an existing project and able to check developer workload when adding an another task', async ({ page }) => {
    await page.getByRole('button', { name: 'Add new task' }).click();
    // await expect(page.locator('span').filter({ hasText: '% (Very free)' }).first()).toBeVisible();
    await page.getByPlaceholder('Enter task name').click();
    await page.getByPlaceholder('Enter task name').fill('Test task1');
    await page.getByLabel('Dave Brown 0 (Very free)').check();
    await page.getByRole('button', { name: 'Add Task' }).click();
    await expect(page.getByText('New task (Test task1) has been').first()).toBeVisible();

    await page.getByRole('button', { name: 'Add new task' }).click();
    await expect(page.getByText('Dave Brown 100.0% (Very busy)')).toBeVisible();
    await expect(page.getByText('Grace Taylor 0.0% (Very free)')).toBeVisible();
    await expect(page.getByText('Judy Thompson 0.0% (Very free)')).toBeVisible();
  });


  test('Should be able to add new developer(s) in the team into the project', async ({ page }) => {
    await page.getByRole('button', { name: 'Add new developers' }).click();
    const allAlrdyIn = await page.getByText('All developers are already in').first();
        
    if (!allAlrdyIn) {
      await expect(page.getByText('Select Developers Leo Garcia')).toBeVisible();
      await page.getByLabel('Leo Garcia').check();
      await page.getByRole('button', { name: 'Add Developers' }).click();
      await expect(page.locator('div').filter({ hasText: 'Developers added successfully!' }).nth(2)).toBeVisible();       
    } 
});




});
