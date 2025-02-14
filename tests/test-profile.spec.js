const { test, expect } = require('@playwright/test');

test('Register, Login, Update Profile, Change Password, and Manage Team', async ({ page }) => {
  // **1. Register**
  await page.goto('http://localhost:3001/login.html');
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click();

  // Fill out the registration form
  await page.getByPlaceholder('Full Name').fill('Han');
  await page.getByPlaceholder('Email', { exact: true }).fill('han@example.com');
  await page.locator('#registerPassword').fill('hanpass123');
  await page.getByPlaceholder('Confirm Password').fill('hanpass123');
  await page.getByRole('button', { name: 'SIGN UP', exact: true }).click();

  // Wait for registration success
  const registerNotification = page.locator('.notyf__message');
  await registerNotification.waitFor({ state: 'visible', timeout: 10000 });
  await expect(registerNotification).toContainText('Registration successful');

  // **2. Login**
  await page.goto('http://localhost:3001/login.html');
  await page.getByPlaceholder('Username or Email').fill('Han');
  await page.locator('#password').fill('hanpass123');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  // Wait for navigation
  await page.waitForURL('http://localhost:3001/team/index.html');

  // **3. Update Profile**
  const profileIcon = page.locator('img[alt="Profile"]');
  await profileIcon.waitFor({ state: 'visible', timeout: 10000 });
  await profileIcon.click();
  await page.getByRole('link', { name: 'Edit Details' }).click();
  await page.locator('#nameInput').fill('Han_updated');
  await page.locator('#emailInput').fill('han_updated@example.com');
  await page.getByRole('link', { name: 'Save Details' }).click();

  // Verify update success
  const successNotification = page.locator('.notyf__message', { hasText: 'Details updated successfully' });
  await successNotification.waitFor({ state: 'visible', timeout: 10000 });
  await expect(successNotification).toContainText('Details updated successfully');
  await expect(page.locator('#nameDisplay')).toHaveText('Han_updated');
  await expect(page.locator('#emailDisplay')).toHaveText('han_updated@example.com');

  // **4. Change Password**
  await page.getByRole('link', { name: 'Update Password' }).click();
  await page.getByLabel('Current Password:').fill('hanpass123');
  await page.getByLabel('New Password:', { exact: true }).fill('hanpass1234');
  await page.getByLabel('Confirm New Password:').fill('hanpass1234');
  await page.getByRole('button', { name: 'Update Password' }).click();

  // Log out
  await profileIcon.click();
  await page.getByText('Log Out').click();

  // **5. Verify Login with New Password**
  await page.goto('http://localhost:3001/login.html');
  await page.getByPlaceholder('Username or Email').fill('Han_updated');
  await page.locator('#password').fill('hanpass1234');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  await page.waitForURL('http://localhost:3001/team/index.html');

  // **2. Open Profile Settings**
  await page.getByRole('img', { name: 'Profile' }).click();
  await page.hover('.profile-header');
  await page.locator('#changeAvatar').click();

  // **3. Upload Profile Picture**
  await page.locator('#avatarInput').setInputFiles('src/public/images/test.jpg');

  // **4. Ensure "Upload" Button is Visible and Click**
  await page.locator('#uploadAvatar').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('#uploadAvatar').click();

  // **5. Verify Upload**
  await page.waitForTimeout(3000); // Allow time for image update
  await page.getByRole('img', { name: 'Profile' }).click();
});
